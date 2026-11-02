using OnlineBookShop.Server.Interfaces;

namespace OnlineBookShop.Server.Infrastructure.Storage
{
    /// <summary>
    /// Stores book images under wwwroot/uploads/books and returns a public URL.
    /// Swapping this for object storage later only requires a new IFileStorage implementation.
    /// </summary>
    public class LocalFileStorage : IFileStorage
    {
        private const long MaxFileSizeBytes = 5 * 1024 * 1024;
        private const string UploadRequestPath = "/uploads/books";
        private const string UploadFolder = "uploads/books";

        private static readonly Dictionary<string, string> AllowedTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            [".jpg"] = "image/jpeg",
            [".jpeg"] = "image/jpeg",
            [".png"] = "image/png",
            [".webp"] = "image/webp",
            [".gif"] = "image/gif"
        };

        private readonly IWebHostEnvironment _environment;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public LocalFileStorage(
            IWebHostEnvironment environment,
            IHttpContextAccessor httpContextAccessor)
        {
            _environment = environment;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<string> SaveImageAsync(
            Stream content,
            string fileName,
            string? contentType,
            CancellationToken cancellationToken = default)
        {
            var extension = Path.GetExtension(fileName);
            if (string.IsNullOrWhiteSpace(extension) || !AllowedTypes.TryGetValue(extension, out var expectedType))
                throw new InvalidOperationException("Unsupported image format. Allowed formats: JPG, PNG, WEBP, GIF.");

            if (!string.IsNullOrWhiteSpace(contentType)
                && !contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
                throw new InvalidOperationException("The uploaded file is not an image.");

            if (!HasValidSignature(content, extension))
                throw new InvalidOperationException("The uploaded file does not look like a valid image.");

            var uploadRoot = GetUploadRoot();
            Directory.CreateDirectory(uploadRoot);

            var storedName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
            var fullPath = Path.Combine(uploadRoot, storedName);

            await using (var target = new FileStream(
                fullPath, FileMode.CreateNew, FileAccess.Write, FileShare.None, 81920, useAsync: true))
            {
                await content.CopyToAsync(target, cancellationToken);
            }

            if (new FileInfo(fullPath).Length > MaxFileSizeBytes)
            {
                File.Delete(fullPath);
                throw new InvalidOperationException("Image must be 5 MB or smaller.");
            }

            var relativePath = $"{UploadRequestPath}/{storedName}";
            var request = _httpContextAccessor.HttpContext?.Request;

            return request == null
                ? relativePath
                : $"{request.Scheme}://{request.Host}{request.PathBase}{relativePath}";
        }

        public Task DeleteAsync(string? url, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(url))
                return Task.CompletedTask;

            var path = url;
            if (Uri.TryCreate(url, UriKind.Absolute, out var absolute))
                path = absolute.AbsolutePath;

            path = Uri.UnescapeDataString(path);
            if (!path.StartsWith(UploadRequestPath + "/", StringComparison.OrdinalIgnoreCase))
                return Task.CompletedTask;

            var uploadRoot = Path.GetFullPath(GetUploadRoot())
                .TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;
            var relativeName = path[(UploadRequestPath.Length + 1)..];
            var fullPath = Path.GetFullPath(Path.Combine(uploadRoot, relativeName));

            // Never delete anything that resolves outside the upload directory.
            if (!fullPath.StartsWith(uploadRoot, StringComparison.OrdinalIgnoreCase))
                return Task.CompletedTask;

            if (File.Exists(fullPath))
                File.Delete(fullPath);

            return Task.CompletedTask;
        }

        private string GetUploadRoot() =>
            Path.Combine(
                string.IsNullOrWhiteSpace(_environment.WebRootPath)
                    ? Path.Combine(_environment.ContentRootPath, "wwwroot")
                    : _environment.WebRootPath,
                UploadFolder);

        private static bool HasValidSignature(Stream stream, string extension)
        {
            if (!stream.CanSeek)
                return true;

            var header = new byte[12];
            var read = stream.Read(header, 0, header.Length);
            stream.Position = 0;

            if (read < 4)
                return false;

            return extension.ToLowerInvariant() switch
            {
                ".jpg" or ".jpeg" => header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF,
                ".png" => header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47,
                ".gif" => header[0] == 0x47 && header[1] == 0x49 && header[2] == 0x46,
                ".webp" => read >= 12
                            && header[0] == 0x52 && header[1] == 0x49 && header[2] == 0x46 && header[3] == 0x46
                            && header[8] == 0x57 && header[9] == 0x45 && header[10] == 0x42 && header[11] == 0x50,
                _ => false
            };
        }
    }
}

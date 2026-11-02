namespace OnlineBookShop.Server.Interfaces
{
    public interface IFileStorage
    {
        Task<string> SaveImageAsync(
            Stream content,
            string fileName,
            string? contentType,
            CancellationToken cancellationToken = default);

        Task DeleteAsync(string? url, CancellationToken cancellationToken = default);
    }
}

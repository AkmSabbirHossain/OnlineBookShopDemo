using OnlineBookShop.Server.Infrastructure.Repositories;
using OnlineBookShop.Server.Interfaces;
using OnlineBookShop.Server.Models;
using OnlineBookShop.Server.Models.DbContext;

namespace OnlineBookShop.Server.Infrastructure.Data
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly AppDbContext _context;
        private readonly Dictionary<Type, object> _repositories = new();

        public UnitOfWork(AppDbContext context)
        {
            _context = context;
        }
        public IRepository<TEntity> Repository<TEntity>() where TEntity : class
        {
            var type = typeof(TEntity);

            if (!_repositories.TryGetValue(type, out var repo))
            {
                var repositoryType = typeof(Repository<>).MakeGenericType(type);
                repo = Activator.CreateInstance(repositoryType, _context)!;
                _repositories[type] = repo;
            }

            return (IRepository<TEntity>)repo;
        }
        public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            return await _context.SaveChangesAsync(cancellationToken);
        }
        public async ValueTask DisposeAsync()
        {
            await _context.DisposeAsync();
        }
    }
}

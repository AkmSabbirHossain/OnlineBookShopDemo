using Microsoft.EntityFrameworkCore;
using OnlineBookShop.Server.Interfaces;
using OnlineBookShop.Server.Models;
using OnlineBookShop.Server.Models.DbContext;
using System.Linq.Expressions;

namespace OnlineBookShop.Server.Infrastructure.Repositories
{
    public class Repository<TEntity> : IRepository<TEntity> where TEntity : class
    {
        protected readonly AppDbContext _context;
        protected readonly DbSet<TEntity> _dbSet;
        public Repository(AppDbContext context)
        {
            _context = context;
            _dbSet = context.Set<TEntity>();
        }
        public virtual async Task<TEntity?> GetByIdAsync(int id)
        {
            return await _dbSet.FindAsync(id);
        }
        public virtual async Task<TEntity?> GetFirstOrDefaultAsync(Expression<Func<TEntity, bool>> predicate)
        {
            return await _dbSet.FirstOrDefaultAsync(predicate);
        }
        public virtual async Task<List<TEntity>> GetAllAsync()
        {
            return await _dbSet.ToListAsync();
        }
        public virtual async Task<List<TEntity>> FindAsync(Expression<Func<TEntity, bool>> predicate)
        {
            return await _dbSet.Where(predicate).ToListAsync();
        }
        public IQueryable<TEntity> GetQueryable()
        {
            return _dbSet.AsQueryable();
        }
        public virtual void Add(TEntity entity)
        {
            _dbSet.Add(entity);
        }
        public virtual void AddRange(IEnumerable<TEntity> entities)
        {
            _dbSet.AddRange(entities);
        }
        public virtual void Update(TEntity entity)
        {
            _dbSet.Update(entity);
        }
        public virtual void Remove(TEntity entity)
        {
            _dbSet.Remove(entity);
        }
        public virtual void RemoveRange(IEnumerable<TEntity> entities)
        {
            _dbSet.RemoveRange(entities);
        }
    }
}

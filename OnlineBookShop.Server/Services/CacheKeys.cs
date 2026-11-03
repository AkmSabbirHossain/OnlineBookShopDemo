namespace OnlineBookShop.Server.Services
{
    public static class CacheKeys
    {
        public const string AllBooks = "AllBooks";
        public const string AllCategories = "AllCategories";
        public const string AllAuthors = "AllAuthors";
        public const string AllPublishers = "AllPublishers";

        public static string BookById(int id) => $"Book_{id}";
    }
}

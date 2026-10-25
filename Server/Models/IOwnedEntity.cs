namespace Server.Models
{
    /// <summary>
    /// A business record that belongs to exactly one user. BakeryDbContext filters every query on these
    /// entities to the current user and stamps/protects UserId when saving.
    /// UserId is nullable only because legacy rows created before authentication have no owner; those rows
    /// are hidden from everyone until a separately approved assignment step.
    /// </summary>
    public interface IOwnedEntity
    {
        int? UserId { get; set; }
    }
}

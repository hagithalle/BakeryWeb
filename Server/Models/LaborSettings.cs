namespace Server.Models
{
    public class LaborSettings
    {
        public int Id { get; set; }          // תמיד יהיה לך רשומה אחת (Id = 1)

        // שכר ברוטו/נטו חודשי רצוי (תבחרי מה את רוצה לנהל)
        public decimal DesiredMonthlySalary { get; set; }

        // עלויות מעסיק – אחוזים מהשכר
        public decimal PensionPercent { get; set; }           // למשל 0.125 = 12.5%
        public decimal KerenHishtalmutPercent { get; set; }   // למשל 0.075 = 7.5%
        public decimal OtherEmployerCostsPercent { get; set; } // אופציונלי – ביטוח לאומי וכו'

        // היקף עבודה
        public int WorkingDaysPerMonth { get; set; }          // למשל 22
        public decimal WorkingHoursPerDay { get; set; }       // למשל 6.5
    }
}



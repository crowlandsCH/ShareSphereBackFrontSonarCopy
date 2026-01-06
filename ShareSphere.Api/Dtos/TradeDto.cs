namespace ShareSphere.Api.Models. Dtos
{
    public class TradeDto
    {
        public int TradeId { get; set; }
        public int ShareholderId { get; set; }
        public int CompanyId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string CompanySector { get; set; } = string.Empty;
        public int BrokerId { get; set; }
        public string BrokerName { get; set; } = string.Empty;
        public TradeType Type { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public DateTime Timestamp { get; set; }
    }
}
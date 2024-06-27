using System.Net.Mail;

namespace Thomas.TMoji.CrossCutting.Configurations
{
    public interface IMailConfig
    {
        string SenderMail { get; set; }
        SmtpClient SmtpClient { get; set; }
    }
}
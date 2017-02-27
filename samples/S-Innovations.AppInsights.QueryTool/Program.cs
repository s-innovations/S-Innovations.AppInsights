using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;
using System;
using System.IO;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using WebApiContrib.Core.WebPages;
using Microsoft.AspNetCore.Builder;

namespace SInnovations.AppInsights.QueryTool
{
    class Program
    {
        private static readonly CancellationTokenSource cancellationTokenSource = new CancellationTokenSource();
        private static readonly ManualResetEvent runCompleteEvent = new ManualResetEvent(false);

        static void Main(string[] args)
        {

            try
            {

                RunAsync(args,
                    cancellationTokenSource.Token).Wait();

            }
            finally
            {
                runCompleteEvent.Set();
            }

        }
        private const string URL =
        "https://api.applicationinsights.io/beta/apps/{0}/{1}";

        private static async Task RunAsync(string[] args, CancellationToken token)
        {
            string environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");

            var builder = new ConfigurationBuilder()
               .SetBasePath(Directory.GetCurrentDirectory())
               .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
               .AddJsonFile($"appsettings.{environment}.json", optional: true)
               .AddEnvironmentVariables();
            var config = builder.Build();
             
            using (var watcher = new FileSystemWatcher("src", "**/*.html"))
            {
                watcher.IncludeSubdirectories = true;
                watcher.Changed += Wa_Changed;
                watcher.NotifyFilter = NotifyFilters.LastWrite | NotifyFilters.Size;
                watcher.EnableRaisingEvents = true;

                using (var host = new WebHostBuilder()
                    .UseKestrel()
                    .UseConfiguration(config)
                    .UseWebRoot("artifacts/app")
                    .UseContentRoot(Directory.GetCurrentDirectory())
                    .ConfigureLogging(l => l.AddConsole(config.GetSection("Logging")))
                    .ConfigureServices(ConfigureServices)
                    .Configure(app =>
                    {
                    // to do - wire in our HTTP endpoints

                    app.UseStaticFiles();
                        app.UseWebPages();
                    })
                    .Build())
                {

                    host.Start();// (token); //.Run(token);

                    await Task.Delay(Timeout.Infinite, token);
                   

                    HttpClient client = new HttpClient();
                    client.DefaultRequestHeaders.Accept.Add(
                        new MediaTypeWithQualityHeaderValue("application/json"));
                    client.DefaultRequestHeaders.Add("x-api-key", "4d3g3zw12n7antl8i3al3epch0x6vaihhzi8tz00");
                    var req = string.Format(URL, "ff4e2b40-e790-43fb-ba2a-636e32669add", "query");

                    var query = @"{""csl"":""set truncationmaxrecords = 10000; set truncationmaxsize = 67108864; traces | where  timestamp > ago(7d) | where customDimensions.MessageTemplate == \""Dequeued {@queueItem} with {id} queue lenght: {queueLenght}\"" | summarize max(todouble(customDimensions.queueLenght))     by bin(timestamp, 120m) | render timechart""}";

                    HttpResponseMessage response = await client.PostAsync(req, new StringContent(query, Encoding.UTF8, "application/json"));
                    if (response.IsSuccessStatusCode)
                    {
                        Console.WriteLine(JToken.Parse(await response.Content.ReadAsStringAsync()).ToString());
                    }
                    else
                    {
                        Console.WriteLine(response.ReasonPhrase);
                    }
                }
            }
        }

        private static void Wa_Changed(object sender, FileSystemEventArgs e)
        {
            Console.WriteLine(e.FullPath);
        }

        private static void ConfigureServices(IServiceCollection services)
        {
            services.AddWebPages(new WebPagesOptions { RootViewName = "index", ViewsFolderName = "./" });
        }
    }
}
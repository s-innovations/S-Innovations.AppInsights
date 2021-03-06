﻿using Microsoft.AspNetCore.Hosting;
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
using Microsoft.AspNetCore.NodeServices;
using Microsoft.AspNetCore.Hosting.Internal;
using Microsoft.Extensions.PlatformAbstractions;

namespace SInnovations.AppInsights.QueryTool
{
    public static class RequireJS
    {
        public static async Task<T2> RunAsync<T1, T2>(INodeServices node, string baseUrl, string module, string host, T1 options)
        {
            var sb = new StringBuilder();

            sb.AppendLine("console.log('starting');");
            sb.AppendLine("var requirejs = require(\"requirejs\");");
            sb.AppendLine($"var r = requirejs.config({{  packages: [{{name: \"{module}\", location: \"libs/{module}/src\"}}], baseUrl:'{baseUrl}'}});");

            sb.AppendLine("module.exports= function (callback,data){ try{");
            sb.AppendLine($"r([\"{module}/runner\"], function (program) {{ program.default(data, callback); }},function(err){{ console.log('host failed'); callback(err,null) }})");



            sb.AppendLine("}catch(error){console.log('host catch');callback(error,null); }}");

            Directory.CreateDirectory("tmp");
            File.WriteAllText("tmp/run.js", sb.ToString());

            return await node.InvokeAsync<T2>("./tmp/run", new
            {
                host = host,
                options = options

            });
        }
    }
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
            args[2] = args[2].Replace("^>", ">").Replace("^<", "<"); ;




            var builder = new ConfigurationBuilder()
               .SetBasePath(Directory.GetCurrentDirectory())
               .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
               .AddEnvironmentVariables();
            var config = builder.Build();


            var _options = new WebHostOptions(config);
            var appEnvironment = PlatformServices.Default.Application;

            var applicationName = _options.ApplicationName ?? appEnvironment.ApplicationName;

            var environment = new HostingEnvironment();
            environment.Initialize(applicationName, Directory.GetCurrentDirectory(), _options);


            var url = "http://localhost:5000";
            var basePath = environment.IsProduction() ?
                   environment.ContentRootPath
                   : Path.Combine(environment.ContentRootPath, "artifacts", "app");


            using (var host = new WebHostBuilder()
                .UseKestrel()
                .UseConfiguration(config)
                .UseUrls(url)
                .UseWebRoot(basePath)
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


                var result = await RequireJS.RunAsync<object, string>(host.Services.GetService<INodeServices>(), basePath.Replace("\\", "/"), "AppInsightsQueryReporter", url, new
                {
                    appId = args[0],
                    appKey = args[1],
                    query = args[2]
                });
                Console.WriteLine(result.ToString());





                //   await Task.Delay(Timeout.Infinite, token);


            }
        }


        private static void ConfigureServices(IServiceCollection services)
        {
            services.AddWebPages(new WebPagesOptions { RootViewName = "index", ViewsFolderName = "src" });
            Console.WriteLine(Directory.GetCurrentDirectory());
            services.AddNodeServices((o) =>
            {
                o.ProjectPath = Directory.GetCurrentDirectory(); // PlatformServices.Default.Application.ApplicationBasePath + "/../../..";
            });
        }
    }
}
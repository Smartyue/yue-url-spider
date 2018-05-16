/**
 * Created by yuanjianxin on 2018/5/14.
 */
const Spider=require('node-spider');
const RedisHandler=require('yue-redis-handler');
const HelperUtil=require('../utils/helper');
module.exports=class UrlSpider{


    /**
     * 构造函数
     * @param startUrl         起始url
     * @param maxCalls         抓取url 总数
     * @param allowedDomains   允许的域名，空数组为无限制
     * @param concurrent       request 并发数
     * @param delay            单个请求超时时间
     * @param error_cb_func    错误回调方法
     * @param done_cb_func     完成任务回调函数
     * @param redisConf        redis config
     * @param redisKey         redis key
     * @param headers          headers
     */
    constructor({startUrl,maxCalls,allowedDomains,concurrent,delay,error_cb_func,done_cb_func,redisConf,redisKey,headers}){
        this.startUrl=startUrl;
        this.maxCalls=maxCalls || 1;
        this.allowedDomains=allowedDomains || [];
        this.concurrent=concurrent || 5;
        this.delay=delay || 0;
        this.error_cb_func=error_cb_func || function (err,url){};
        this.done_cb_func=done_cb_func || function () {};
        this.redisConf=redisConf;
        this.redisKey=redisKey;
        this.redisHandler=null;
        this.index=0;
        this.headers=headers || { 'user-agent': 'node-spider' },
        this.spider=null;
    }

    handleRequest(doc){
        doc.$('a').each((i,elem)=>{
            let href=doc.$(elem).attr('href').split('#')[0];
            let url=doc.resolve(href);
            let check=this.opts.allowedDomains.length==0 ? true : HelperUtil.checkDomain(this.opts.allowedDomains,url);
            if(this.opts.index<this.opts.maxCalls && check){
                this.opts.index+=1;
                //todo 这里可能需要包装
                this.opts.redisHandler.exec('rpush',this.opts.redisKey,url);
                this.queue(url,this.opts.handleRequest);
            }
        });
    }

    async run(){
        this.redisHandler=new RedisHandler();
        this.redisHandler.init(this.redisConf);
        this.spider=new Spider({
            concurrent: this.concurrent,
            // How long to wait after each request
            delay: this.delay,
            // A stream to where internal logs are sent, optional
            logs: process.stderr,
            // Re-visit visited URLs, false by default
            allowDuplicates: false,
            // If `true` all queued handlers will be try-catch'd, errors go to `error` callback
            catchErrors: true,
            // If `true` the spider will set the Referer header automatically on subsequent requests
            addReferrer: false,
            // If `true` adds the X-Requested-With:XMLHttpRequest header
            xhr: false,
            // If `true` adds the Connection:keep-alive header and forever option on request module
            keepAlive: false,
            // Called when there's an error, throw will be used if none is provided
            error: this.error_cb_func,
            // Called when there are no more requests
            done: this.done_cb_func,

            //- All options are passed to `request` module, for example:
            headers: this.headers,
            encoding: 'utf8',

            allowedDomains:this.allowedDomains,
            index:this.index,
            maxCalls:this.maxCalls,
            redisHandler:this.redisHandler,
            redisKey:this.redisKey,
            handleRequest:this.handleRequest
        });

        this.spider.queue(this.startUrl,this.handleRequest);
    }



}
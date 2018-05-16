/**
 * Created by yuanjianxin on 2018/5/16.
 */
const urlReg=/[a-zA-Z0-9][-a-zA-Z0-9]{0,62}(\.[a-zA-Z0-9][-a-zA-Z0-9]{0,62})+\.?/;
module.exports={

    /**
     * 检测链接是否在给定的域名中
     * @param domainList
     * @param url
     * @returns {boolean}
     */
    checkDomain(domainList,url){
        let domain=urlReg.exec(url);
        return domainList.includes(domain[0]);
    }
};
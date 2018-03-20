import { AlertController,LoadingController,ToastController } from 'ionic-angular';
import { Injectable,Inject } from '@angular/core';
import { Storage } from '@ionic/storage';
import { App } from '../../config/app';
import * as _ from 'lodash';

export interface SiteArray{
    site: string;
    title: string;
    domain:string;
}
export interface Site{
    data:SiteArray,
    array:Array<SiteArray>
}


@Injectable()
export class SiteStorage{
    site = "_site";
    siteArray = "_site_array";
    textAlertRemove = 'Do You Want to Remove This Site?!';
    textAlertRemoveLastOne = 'Can not Delete this site because site must at least one!';
    textToastSiteRemove = 'Remove Site Complete!';
    
	constructor(@Inject('config') private config:any,public storage: Storage,public alertCtrl:AlertController,public toastCtrl:ToastController){

    }
    
    async getConfigApp(){
        return await this.config?this.config:App;
    }

    async setSite(site: string){
        let config = await this.getConfigApp();
        await this.storage.set(config.app+this.site,site);
        return site;
    }
    async getSite(){
        let config = await this.getConfigApp();
        let site = await this.storage.get(config.app+this.site);
        return site;
    }
    async selectSiteArray(site: SiteArray){
        if(site){
          let array = await this.getSiteArray();
          if(array.data.domain != site.domain){
            array.data = site;
            await this.setSite(array.data.site);
            await this.setSiteArray(array);
            return array;
          }
        }
        return 0;
      }
    async checkRepeatSiteArray(domain: string){
        let array = await this.getSiteArray();
        if(array){
          let check = true;
          array.array.forEach((item:any)=>{
            if(item.domain === domain){
              check = false;
            }
          });
          return check;
        }
        return 1;
    }

    async alertRemoveSite(){
        return new Promise<any>((resolve,reject)=>{
          let alert = this.alertCtrl.create({
                      title: 'Attention',
                      subTitle: this.textAlertRemove,
                      buttons: [{
                          text: 'Yes',
                          handler: () => {
                             resolve(1);
                          }
                       }]
          });
          alert.present();
        });
    }
    async removeSiteArray(site:SiteArray){
        let array = await this.getSiteArray();
        if(array){
          if(array.array.length > 1){
            let confirm = await this.alertRemoveSite();
            if(confirm){
              array.array = _.filter(array.array,(elem)=>(elem as any).site != site.site);
              if(site.site == array.data.site){
                array.data = array.array[0];  
              }
              let siteCallback = await this.updateSiteArray(array);
              let toast = this.toastCtrl.create({
                message:this.textToastSiteRemove,
                duration:500,
                position:"top"
              })
              toast.present();
              return siteCallback;
            }
            return 0;
          }
          let alert = this.alertCtrl.create({
            title: 'Attention',
            subTitle: this.textAlertRemoveLastOne,
            buttons: [{
                text: 'Yes',
                handler: () => {
                }
             }]
          });
          alert.present();
        }
        return 0;
    }
    async pushSiteArray(site:SiteArray,force=false){
        let arraySite:any;
        if(force){
          arraySite = <Site>{};
          arraySite.data = site;
          arraySite.array = [];
          arraySite.array.push(site);
          let siteCallback = await this.updateSiteArray(arraySite);
          return siteCallback;
        }
        let callback = await this.getSiteArray();
        if(callback){
          arraySite = callback;
        }else{
          arraySite = <Site>{};
          arraySite.data = site;
          arraySite.array = [];
        }
        arraySite.array.push(site);
        let siteCallback = await this.updateSiteArray(arraySite);
        return siteCallback;
    }
    async setSiteArray(site:Site){
        let config = await this.getConfigApp();
        await this.storage.set(config.app+this.siteArray,site);
        return 1;
    }
    async getSiteArray(update=false){
        let config = await this.getConfigApp();
    
        let site = await this.storage.get(config.app+this.siteArray);
        
        if(update){
        let callback = await this.updateMainSiteArray(site);
        return callback;
        }
        return site;
    }
    async updateSiteArray(site:Site){
        let save = await this.setSiteArray(site);
        if(save){
          let number = await this.getSite();
          if(!number){
            let callback = await this.updateMainSiteArray(site);
            return callback;
          }
          return site;
        }
        return 0;
    }
    async updateMainSiteArray(site:Site){
        if(site){
          let mainSite = site.data.site || false;
          if(mainSite){
             let callback = await this.setSite(mainSite);
              return site;
          }
          return 0;
        }
        return site;
    }
    


    
}
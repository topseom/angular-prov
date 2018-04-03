import {Injectable} from "@angular/core";
import {Storage} from '@ionic/storage';
import 'rxjs/add/operator/take'
import { AlertController,LoadingController } from 'ionic-angular';
import { SiteStorage } from './site-storage';
import { QueryService, Options  } from './query-service';
import ImgCache from 'imgcache.js';
import { table,api } from './interface';
import * as _ from 'lodash';

export class Setting{
  offline = false;
}

let _images = {
  items:[],
  async addImage(images:Array<any>){
    this.items = this.items.concat(_.uniq(images).filter((e)=>e));
    return 1;
  },
  getImages(){
    return this.items;
  },
  clear(){
    this.items = [];
  }
}

@Injectable()
export class StorageService {
  storeLocal = "dataSet";
  settingTitle = "setting";
  
  constructor(public _query:QueryService,public _siteStore:SiteStorage,public storage: Storage, public alertCtrl:AlertController,public loadingCtrl:LoadingController) {
  }

  storageList(){
    this.storage.forEach((value,key)=>{
      console.log("Key",key);
      console.log("Value",value);
    });
  }

  async setLocal(title,data){
    let site = await this._siteStore.getSite();
    if(site){
      let config = await this._siteStore.getConfigApp();
      let callback = await this.storage.set(config.app+'_'+site+'_'+title,JSON.stringify(data));
      return 1;
    }
    return 0;
  }

  async getLocal(title){
    let site = await this._siteStore.getSite();
    let config = await this._siteStore.getConfigApp();
    let cache = await this.storage.get(config.app+'_'+site+'_'+title);
    return JSON.parse(cache);
  }

  async setSetting(setting :Setting){
    let callback = await this.setLocal(this.settingTitle,setting);
    return 1;
  }

  async getSetting(){
    let callback = await this.getLocal(this.settingTitle);
    if(callback){
      return callback;
    }
    let setting = new Setting();
    return setting;
  }

  async removeLocal(title){
    let site = await this._siteStore.getSite();
    let config = await this._siteStore.getConfigApp();
    let cache = await this.storage.remove(config.app+'_'+site+'_'+title);
    return cache;
  }

  async isData(){
    let callback = await this.getLocal(this.storeLocal);
    if(callback){
      return true;
    }
    return false;
  }

  async loadData(data,force=false){
    let load = async() =>{
      let table;
      table = data.slice().reverse();
      let loader = this.loadingCtrl.create()
      let list = {};
      let callback = await this.forDataLoad(table,loader,list);
      if(callback){
        await this.setLocal(this.storeLocal,callback);
        return callback;
      }
      return 0;
    }
    _images.clear();
    if(force){
     await load();
     return 1;
    }
    let cache = await this.getLocal(this.storeLocal);
    if(cache){
      return 1;
    }
    await load();
    return 1;
  }

  async loadDataTable(table_argument){
      let data = [];
      switch(table_argument){
        case table.product_list:
          data = await this._query.query(table.product_list,new Options({method:"get", api:api.product_list}));
          // have image (image.image)
          if(data && data.length > 0){
            let images = data.map((img)=>img.image);
            let sucess = await _images.addImage(images);
            return data;
          }
          return data;
        case table.product_category:
          // no image
        
          return await this._query.query(table.product_list,new Options({method:"get",api:api.product_category}));
        case table.product_barcode:
          return await this._query.query(table.product_barcode,new Options());
        case table.product_single:
          // have image (image_c,image_array)
          data = await this._query.query(table.product_single,new Options({method:"get",api:api.product_single}));
          if(data && data.length > 0){
            let images = [];
            data.forEach(result=>{
              images.push(result.image_c);
              if(result.image_array && JSON.parse(result.image_array).length > 0){
                JSON.parse(result.image_array).forEach(img=>{
                  img.path && images.push(img.path);
                });
              }
            });
            await _images.addImage(images);
          }
          return data;
        case table.blog_category:
          // no image
          return await this._query.query(table.product_category,new Options({ lang:true,method:"get",api:api.blog_category}));
        case table.blog_list:
          data = await this._query.query(table.blog_list,new Options({ lang:true,method:"get",api:api.blog_list}));
          if(data && data.length > 0){
            let images = data.map((result)=>result.image_t);
            await _images.addImage(images);
          }
          return data;
        case table.gallery_category:
          // no image
          return await this._query.query(table.gallery_category,new Options({method:"get",api:api.gallery_category}));
        case table.gallery_single:
          // have image (image and array=>galleries->path)
          data = await this._query.query(table.gallery_single,new Options({method:"get",api:api.gallery_single}));
          if(data && data.length > 0){
            let images = [];
            data.forEach(result=>{
              images.push(result.image);
              if(result.galleries && result.galleries.length > 0){
                result.galleries.forEach(child=>{
                  child.path && images.push(child.path);
                });
              }
            });
            await _images.addImage(images);
          }
          return data;
        case table.navigation:
          // have image (image.icon_image.path)
          data = await this._query.query(table.navigation,new Options({ lang:true,method:"get",api:api.navigation}));
          if(data && data.length > 0){
            let images = await this.forImageChildren(data,"children",[]);
            images = images.map((img)=>img.icon_image && img.icon_image.path);
            await _images.addImage(images);
          }
          //console.log("callback data",data);
          return data;

        case table.page_single:
          // have image in (html=>body)
          data = await this._query.query(table.page_single,new Options({ lang:true,method:"get",api:api.page_single}));
          let rex = /<img[^>]+src="?([^"\s]+)"/g;
          let images_page = [];
          if(data && data.length > 0){
            data.forEach(obj=>{
              let m,array =[];
              while (m = rex.exec(obj.body)) {
                array.push(m[1]);
              }
              if(obj.slug == "customer-reference"){
                //console.log(array);
              }
              
              if(array.length > 0){
                images_page = images_page.concat(array);
              }
            });
            await _images.addImage(images_page);
          }
          return data;
        case table.portfolio_category:
          // have image (image.image)
          data = await this._query.query(table.portfolio_category,new Options({lang:true,method:"get",api:api.portfolio_category}));
          if(data && data.length > 0){
            let images = data.map((result)=>result.image);
            await _images.addImage(images);
          }
          return data;
        case table.portfolio_single:
          // have image (image.images)
          data = await this._query.query(table.portfolio_single,new Options({lang:true,method:"get",api:api.portfolio_single}))
          if(data && data.length > 0){
            let images = [];
            images = data.map((result)=>result.images).reduce((array,result)=>array.concat(result));
            await _images.addImage(images);
          }
          return data;
        case table.order_single:
          return await this._query.query(table.order_single,new Options());
        case table.users_single:
          return await this._query.query(table.users_single,new Options({ method:"get",api:api.users_single}));
        case table.form_config:
          return await this._query.query(table.form_config,new Options());
        case table.images:
          let images = _images.getImages();
          await this.saveImage(images);
          return images;
      }
   
  }

  forImageChildren(array:Array<any>,key,result:Array<any>){
    return new Promise<any>((resolve,reject)=>{
      array.forEach(data=>{
        if(data[key] && data[key].length){
          resolve(this.forImageChildren(data[key],key,result));
        }
        result.push(data)
        resolve(result);
      });
    });
  }

  async forDataLoad(table,loader,list:object){
    let data = table[table.length - 1];
    table.pop();
    loader.setContent("Loading "+data['data']+"..");
    if(!loader.present()){
      loader.present();
    }
    let callback = await this.loadDataTable(data['data']);
    list[data['data']] = callback;
    if(table.length == 0){
      await loader.dismiss();
      return list; 
    }else{
      let callbackFor = await this.forDataLoad(table,loader,list);
      return callbackFor;
    }
  }

  saveImage(imageArray :Array<any>){
    return new Promise<any>((resolve,reject)=>{
      let storeCache = () => {
        if(imageArray.length){
          imageArray.forEach((data,index)=>{
              ImgCache.cacheFile(data,data=>{
                if(index == imageArray.length-1){
                  resolve(1);
                }
              },err=>{
                if(index == imageArray.length-1){  
                  resolve(1);
                }
              });
          });
        }else{
          resolve(1);
        }   
      }
      if(!imageArray){
        imageArray = [];
      }
      ImgCache.init(()=>{
        ImgCache.clearCache(()=>{
          storeCache();
        },()=>{
          storeCache();
        });
      },()=>{
        resolve(1);
      })
    });
  }

  async getLocalData(table){
    let cache = await this.getLocal(this.storeLocal);
    if(cache){
      return cache[table] || 0;
    }
    return 0;
  }

}

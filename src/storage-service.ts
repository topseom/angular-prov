import {Injectable} from "@angular/core";
import {Storage} from '@ionic/storage';
import 'rxjs/add/operator/take'
import {AlertController,LoadingController} from 'ionic-angular';
import {SiteService} from './site-service';
import {QueryService} from './query-service';
import ImgCache from 'imgcache.js';
import { table } from './interface';
import * as _ from 'lodash';

export class Setting{
  offline = false;
}

let _images = {
  items:[],
  addImage(images:Array<any>){
   return new Promise((resolve,reject)=>{
      this.items = this.items.concat(_.uniq(images).filter((e)=>e));
      resolve(1);
   });
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
  
  constructor(public _query:QueryService,public _site:SiteService,public storage: Storage, public alertCtrl:AlertController,public loadingCtrl:LoadingController) {
  }

  storageList(){
    this.storage.forEach((value,key)=>{
      console.log("Key",key);
      console.log("Value",value);
    });
  }

  setLocal(title,data){
    return new Promise((resolve, reject) => {
      this._site.getSite().then(site=>{
          if(site){
            this._site.getConfigApp().then(config=>{
              this.storage.set(config.app+'_'+site+'_'+title,JSON.stringify(data)).then(callback=>{
                resolve(1);
              });
            });
            
          }else{
            resolve(0);
          }
      });
    });
  }

  getLocal(title){
    return this._site.getSite().then((site)=>{
      return this._site.getConfigApp().then(config=>{
        return this.storage.get(config.app+'_'+site+'_'+title).then((cache) =>{
          return JSON.parse(cache);
        });
      });
    });
  }

  setSetting(setting :Setting){
    return new Promise<any>((resolve,reject)=>{
      this.setLocal(this.settingTitle,setting).then(callback=>{
        resolve(1);
      });
    });
  }
  getSetting(){
    return new Promise<Setting>((resolve,reject)=>{
      this.getLocal(this.settingTitle).then(callback=>{
        if(callback){
          resolve(callback) 
        }else{
          let setting = new Setting();
          resolve(setting);
        }
      });
    });
  }

  removeLocal(title){
    return this._site.getSite().then((site)=>{
      return this._site.getConfigApp().then(config=>{
        return this.storage.remove(config.app+'_'+site+'_'+title).then((cache)=>{
          return cache;
        });
      });
    });
  }

  isData(){
    return new Promise<any>((resolve,reject)=>{
      this.getLocal(this.storeLocal).then(callback=>{
          if(callback){
            resolve(true);
          }else{
            resolve(false);
          }
      });
    });
  }
  loadData(data,force=false){
    let load = () =>{
      return new Promise((resolve,reject)=>{
        let table;
        table = data.slice().reverse();
        let loader = this.loadingCtrl.create()
        let list = {} ;
        this.forDataLoad(table,loader,list).then(callback=>{
          if(callback){
            this.setLocal(this.storeLocal,callback).then(finish=>{
              resolve(callback);
            });
          }else{
            resolve(0);
          } 
        });
      });
    }
    return new Promise((resolve,reject)=>{
      _images.clear();
      if(force){
        load().then(callback=>{
            resolve(1);
        });
      }else{
        this.getLocal(this.storeLocal).then(cache=>{
          if(cache){
              resolve(1);
          }else{
              load().then(callback=>{
                resolve(1);
              });
          }
        }); 
      }
    });
  }
  loadDataTable(table_argument){
    return new Promise((resolve,reject)=>{
      switch(table_argument){
        case table.product_list:
          this._query.product_listAll({}).then(data=>{
            // have image (image.image)
            if(data && data.length > 0){
              let images = data.map((img)=>img.image);
              _images.addImage(images).then(sucess=>{
                resolve(data);
              });
            }else{
              resolve(data);
            }
          });
          break;
        case table.product_category:
          // no image
          this._query.product_category({}).then(data=>{
            resolve(data);
          });
          break;
        case table.product_barcode:
          this._query.product_barcode({}).then(data=>{
            resolve(data);
          });
          break;
        case table.product_single:
          // have image (image_c,image_array)
          this._query.product_single({}).then(data=>{
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
              _images.addImage(images).then(sucess=>{
                resolve(data);
              });
            }else{
              resolve(data);
            }
          });
          break;
        case table.blog_category:
          // no image
          this._query.blog_categories({}).then(data=>{
            resolve(data);
          });
          break;
        case table.blog_list:
          this._query.blog_listAll({}).then(data=>{
            // have image (image.image_t or image_c)
            if(data && data.length > 0){
              let images = data.map((result)=>result.image_t);
              _images.addImage(images).then(sucess=>{
                resolve(data);
              });
            }else{
              resolve(data);
            }
          });
          break;
        case table.gallery_category:
          // no image
          this._query.gallery_category({}).then(data=>{
            resolve(data);
          });
          break;
        case table.gallery_single:
          // have image (image and array=>galleries->path)
          this._query.gallery_single({}).then(data=>{
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
              _images.addImage(images).then(sucess=>{
                resolve(data);
              });
            }else{
              resolve(data);
            }
          });
          break;
        case table.navigation:
          // have image (image.icon_image.path)
          this._query.navigations({}).then(data=>{
            if(data && data.length > 0){
              this.forImageChildren(data,"children",[]).then(images=>{
                images = images.map((img)=>img.icon_image && img.icon_image.path);
                _images.addImage(images).then(sucess=>{
                  resolve(data);
                });
              });
            }else{
              resolve(data);
            }
          });
          break;
        case table.page_single:
          // have image in (html=>body)
          this._query.page_single({}).then(data=>{
            let rex = /<img[^>]+src="?([^"\s]+)"/g;
            let images = [];
            if(data && data.length > 0){
              data.forEach(obj=>{
                let m,array =[];
                
                while (m = rex.exec(obj.body)) {
                  array.push(m[1]);
                }
                if(obj.slug == "customer-reference"){
                  console.log(array);
                }
                
                if(array.length > 0){
                  images = images.concat(array);
                }
              });
              _images.addImage(images).then(sucess=>{
                resolve(data);
              });
            }else{
              resolve(data);
            }
          });
          break;
        case table.portfolio_category:
          // have image (image.image)
          this._query.portfolio_categories({}).then(data=>{
            if(data && data.length > 0){
              let images = data.map((result)=>result.image);
              _images.addImage(images).then(sucess=>{
                resolve(data);
              });
            }else{
              resolve(data);
            }
          });
          break;
        case table.portfolio_single:
          // have image (image.images)
          this._query.portfolio_single({}).then(data=>{
            if(data && data.length > 0){
              let images = [];
              images = data.map((result)=>result.images).reduce((array,result)=>array.concat(result));
              _images.addImage(images).then(sucess=>{
                resolve(data);
              });
            }else{
              resolve(data);
            }
          });
          break;
        case table.order_single:
          this._query.order_single({}).then(data=>{
            resolve(data);
          });
          break;
        case table.users_single:
          this._query.users_single({}).then(data=>{
            resolve(data);
          });
          break;
        case table.form_config:
          this._query.form_config({}).then(data=>{
            resolve(data);
          });
        case table.images:
          /*this._query.images({}).then(data=>{
            this.saveImage(data).then(callback=>{
              resolve(data);
            });
          });*/
          let images = _images.getImages();
          this.saveImage(images).then(callback=>{
            resolve(images);
          });  
          break;
        
      }
    });
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

  forDataLoad(table,loader,list:object){
    let data = table[table.length - 1];
    table.pop();
    loader.setContent("Loading "+data['data']+"..");
    if(!loader.present()){
      loader.present();
    }
    return new Promise((resolve,reject)=>{
      this.loadDataTable(data['data']).then(callback=>{
        list[data['data']] = callback;
        if(table.length == 0){
          loader.dismiss().then(finish=>{
            resolve(list);
          });
        }else{
          this.forDataLoad(table,loader,list).then(callbackFor=>{
                resolve(callbackFor);
          });
        }
      });
    });
  }

  saveImage(imageArray :Array<any>){
    return new Promise<any>((resolve,reject)=>{
      let storeCache = () => {
        //alert("begin "+imageArray.length);
        if(imageArray.length){
          //let error_status = false;
          imageArray.forEach((data,index)=>{
              ImgCache.cacheFile(data,data=>{
                //console.log(data);
                if(index == imageArray.length-1){
                  resolve(1);
                  /*if(error_status){
                    let alert = this.alertCtrl.create({
                    title: 'Attendtion!',
                    subTitle: "Image Cache Not Loading Complete!",
                    buttons: [{
                        text: 'Ok',
                        handler: () => {
                           resolve(1);
                        }
                     }]
                    });
                    alert.present();
                  }else{
                    let alert = this.alertCtrl.create({
                    title: 'Success!',
                    subTitle: 'Load Image Cache Finish!',
                    buttons: [{
                        text: 'Ok',
                        handler: () => {
                           resolve(1);
                        }
                     }]
                    });
                    alert.present();
                  }*/
                }
              },err=>{
                //error_status = true;
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
  getLocalData(table){
    return new Promise<any>((resolve,reject)=>{
      this.getLocal(this.storeLocal).then(cache=>{
          if(cache){  
            resolve(cache[table] || 0);
          }else{
            resolve(0);
          }
      });
    })
  }
  /*saveImage(imageArray :Array<any>){
    if(ImgCache.ready){
      let data = imageArray[imageArray.length-1];
      imageArray.pop();
      console.log(data);
      return new Promise<any>((resolve,reject)=>{
          if(imageArray.length == 0){
            ImgCache.cacheFile(data,data=>{
              console.log("Save Image Complete : "+data);
              resolve(1);
            },err=>{
              resolve(0);
            });
          }else{  
            ImgCache.cacheFile(data,data=>{
              this.saveImage(imageArray).then(callback=>{
                console.log("Save Image Complete : "+data);
                resolve(callback);
              });
            },err=>{
              resolve(0);
            });
          }
      });
    }
  }*/



}

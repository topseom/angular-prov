import {Injectable} from "@angular/core";
import {Storage} from '@ionic/storage';
import { HttpClient } from '@angular/common/http';
import { Network } from '@ionic-native/network';
import {AlertController,LoadingController,ToastController} from 'ionic-angular';

import 'rxjs/add/operator/take';
import * as _ from 'lodash';
import * as tsfirebase from 'firebase';
const firebase = tsfirebase;

firebase.initializeApp({
  apiKey: "AIzaSyCYIxQwZTTbTjbY2Nmzom0DS_gLec3K6rs",
  authDomain: "main-f50e4.firebaseapp.com",
  databaseURL: "https://main-f50e4.firebaseio.com",
  projectId: "main-f50e4",
  storageBucket: "main-f50e4.appspot.com",
  messagingSenderId: "229358120035"
});

import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { TranslateService } from '@ngx-translate/core';
//declare module 'imgcache.js';

import * as ImgCache from 'imgcache.js';

//import { AngularFireDatabase } from 'angularfire2/database';

import { App } from '../../config/app';
import { textInternetConnectOffline } from './interface';
let setting = App;
let demo_mobile = setting.platform == "mobile" && setting.demo;

export interface SiteArray{
  site: string;
  title: string;
  domain:string;
}
export interface Site{
  data:SiteArray,
  array:Array<SiteArray>
}

export interface RootConfig{
  siteArray?:string;
  site?:string;
  user?:boolean;
  demo?:boolean;
}

export class CallbackSetRoot{
  auth = false;
  setSite = false;
  language = [{title:"en"},{title:"th"}];
  demo = false;
}



@Injectable()
export class SiteService{

  devMode = false;
  checkCreateTable = false;
  siteWeb = "_site_web";
  theme = "_theme";
  site = "_site";
  siteArray = "_site_array";
  localCheckTable = "_checkTable";
  tableRef = "table/";


  textLoadingCheckDatabase = "check database .."; 
  textLoadingSiteRef ="Loading ...<br>(Ref)";
  textLoadingTheme = "Loading Theme...";
  textToastSiteRemove = 'Remove Site Complete!';
  textAlertRemove = 'Do You Want to Remove This Site?!';
  textAlertRemoveLastOne = 'Can not Delete this site because site must at least one!';
  textErrorConnect = "Can't Connect Database";
  constructor(private network: Network,public translate: TranslateService,public platform: Platform,public statusBar: StatusBar,public splashScreen: SplashScreen,private http: HttpClient,public storage: Storage,public toastCtrl:ToastController,public alertCtrl:AlertController,public loadingCrtl:LoadingController) {
  }

  showList(){
    this.storage.forEach((value,key)=>{
      console.log("Key",key);
      console.log("Value",value);
    });
  }
  


  //Config App
  setRoot(config:RootConfig){

    let getCacheSiteWeb = (site:any) =>{
      return new Promise<any>((resolve,reject)=>{
        this.getConfigApp().then(config=>{
          this.storage.get(config.app+this.siteWeb).then(cache=>{
            if(cache && cache[site]){
              //console.log("CACHE SITE SELECT",cache , site);
              resolve(site);
            }else{
              resolve(0);
            }
          });
        });
      });
    }
    let setCacheSiteWeb = (site:any) =>{
      return new Promise((resolve,reject)=>{
        this.getConfigApp().then(config=>{
          this.storage.get(config.app+this.siteWeb).then(cache=>{
            if(cache){
              cache[site] = true;
              site = cache;
            }else{
              let object = <any>{};
              object[site] = true;
              site = object;
            }
            //console.log("CACHE SITE ALL",site);
            this.storage.set(config.app+this.siteWeb,site).then(site=>{
               resolve(site);
            });
          });
        });
        resolve(1)
      });
    }
    let authSite = (site:any) =>{
        return new Promise((resolve,reject)=>{
          if(site){
            let loader = this.loadingCrtl.create();
            loader.setContent(this.textLoadingSiteRef);
            loader.present();
              let ref = firebase.database().ref().child("SITE/ref_list/"+site);
              ref.once('value').then(function (snapshot:any) {
                loader.dismiss().then(callback=>{
                  if(snapshot.val()){     
                    setCacheSiteWeb(site).then(finish=>{
                      resolve(site);
                    });  
                  }else{
                    resolve(0);
                  }
                });
              });
          }else{
            resolve(0);
          }
        });
    }
    let returnRoot = (site="") =>{

      return new Promise<CallbackSetRoot>((resolve,reject)=>{
        let callbackRoot = new CallbackSetRoot();
        if(demo_mobile){
          config.siteArray = null;
          config.site = null;
          callbackRoot.demo = true;
        }
        if(config.siteArray){
          if(site)
            config.siteArray = site;
          config.site = config.siteArray;
        }
        if(config.user && !config.site){
            this.getUser().then(user=>{
              if(user){
                callbackRoot.auth = true;
              }
              resolve(callbackRoot);
            });
        }else if(config.user && config.site){
              if(config.siteArray){
                callbackRoot.setSite = true;
                this.pushSiteArray({
                  site: config.siteArray,
                  title: "",
                  domain:""
                },true).then(callback=>{
                  this.setSite(site || config.siteArray).then(callback=>{
                    this.getUser().then(user=>{
                      if(user){
                        callbackRoot.auth = true;
                      }
                      resolve(callbackRoot);
                    });
                  });
                });
              }else{
                this.setSite(site || config.site).then(callback=>{
                  this.getUser().then(user=>{
                   if(user){
                      callbackRoot.auth = true;
                   }
                   callbackRoot.setSite = true;
                   resolve(callbackRoot);
                  });
                });
              }
            
        }else if(!config.user && config.site){
              if(config.siteArray){
                callbackRoot.setSite = true;
                this.pushSiteArray({
                  site: config.siteArray,
                  title: "",
                  domain:""
                },true).then(callback=>{
                  this.setSite(site || config.siteArray).then(callback=>{
                    resolve(callbackRoot);
                  });
                });
              }else{
                this.setSite(site || config.site).then(callback=>{
                  callbackRoot.setSite = true;
                  resolve(callbackRoot);
                });
              }
              
        }else{
              resolve(callbackRoot);
        }
      });
    }
    let getSiteUrl = () =>{
      return new Promise<any>((resolve,reject)=>{
         let name = "site";
         let url = location.href;
         name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
         var regexS = "[\\?&,]"+name+"=([^&,#]*)";
         var regex = new RegExp( regexS );
         var results = regex.exec( url );

         /* Open Cache */
         getCacheSiteWeb(results == null ? null : results[1]).then(site=>{
             if(site){
                //console.log("<=== IF SITE ===>",site);
                resolve(site);
             }else{
              authSite(results == null ? null : results[1]).then(callback=>{
                 resolve(callback);
              });
             }
         });
         /* Close Cache */
         /*authSite(results == null ? null : results[1]).then(callback=>{
            resolve(callback);
         });*/
         
      });
    }
    return new Promise<CallbackSetRoot>((resolve,reject)=>{
      this.getConfigApp().then(app=>{
        app = app.platform;
        if(app == "web"){
          getSiteUrl().then(site=>{
            if(site){
              /* Site Defined */
              returnRoot(site).then(callback=>{
                  //console.log("<== FINISH ==>");
                  resolve(callback);
              });
            }else{
              /* Site Not Defined */
              returnRoot().then(callback=>{
                resolve(callback);
              });
            }
          });
        }else{
          returnRoot().then(callback=>{
            resolve(callback);
          });
        }
      });
    });
  }
  selectLanguage(lang:any){
    this.translate.use(lang);
  }
  appInit(){
    return new Promise<any>((resolve,reject)=>{
      this.translate.setDefaultLang('en');
      ImgCache.init();
      this.platform.ready().then(() => {
          this.statusBar.styleDefault();
          this.statusBar.overlaysWebView(false);
          this.splashScreen.hide();
      });
    });
  }
  getConfigApp(){
    return new Promise<any>((resolve,reject) => {
        resolve(App);
    });
  }
  
  getUser(){
    return new Promise<any>((resolve,reject)=>{
      this.getConfigApp().then(config=>{
        this.getSite().then(site=>{
          this.storage.get(config.app+'_'+site+'_user').then(callback=>{
            resolve(JSON.parse(callback));
          })
        });
      });
    });
  }


  //Main Site
  setSite(site: string){

    return new Promise<any>((resolve, reject) => {
      this.getConfigApp().then(config=>{
        if(this.checkCreateTable){
          this.storage.set(config.app+this.site,site).then(callback=>{
            
              this.checkTable(this.devMode).then(checked=>{
                if(checked){
                  resolve(1);
                }else{
                  resolve(0);
                }
              });
            
          });
        }else{

            this.storage.set(config.app+this.site,site).then(callback=>{
              this.getConfigApp().then(config=>{
                if(config.platform == "web"){
                  this.loadTheme({load:false}).then(callback=>{
                    resolve(1);
                  });
                }else{
                  this.loadTheme({load:true}).then(callback=>{
                    resolve(1);
                  });
                }
              });
              
            });
         
        }
        
      });

    });
  }
  getSite(){
    return new Promise<any>((resolve, reject) => {
      this.getConfigApp().then(config=>{
        this.storage.get(config.app+this.site).then(site=>{
           resolve(site);
        });
      });
    });
  }




  //Array
  selectSiteArray(site: SiteArray){
    return new Promise<any>((resolve,reject)=>{
      if(site){
         this.getSiteArray().then(array=>{
           if(array.data.domain != site.domain){
             array.data = site;
             this.setSite(array.data.site).then(status=>{
               this.setSiteArray(array).then(callback=>{
                 resolve(array);
               });
             });
           }else{
             resolve(0);
           }
         });
      }else{
        resolve(0);
      }
    });
  }
  checkRepeatSiteArray(domain: string){
    return new Promise<any>((resolve,reject)=>{
      this.getSiteArray().then(array=>{
        if(array){
          let check = true;
          array.array.forEach((item:any)=>{
            if(item.domain === domain){
              check = false;
            }
          });
          resolve(check);
        }else{
          resolve(1);
        }
      })
    });
  }

  alertRemoveSite(){
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
  removeSiteArray(site:SiteArray){
    return new Promise<any>((resolve,reject)=>{
          this.getSiteArray().then(array=>{
              if(array){
                if(array.array.length > 1){
                  this.alertRemoveSite().then(confirm=>{
                    if(confirm){
                      array.array = _.filter(array.array,(elem)=>(elem as any).site != site.site);
                      if(site.site == array.data.site){
                        array.data = array.array[0];  
                      }
                      this.updateSiteArray(array).then(siteCallback=>{
                        let toast = this.toastCtrl.create({
                          message:this.textToastSiteRemove,
                          duration:500,
                          position:"top"
                        })
                        toast.present();
                        resolve(siteCallback);
                      })
                    }
                  });
                }else{
                  resolve(0);
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
              }else{
                resolve(0);
              }
          });
    });
  }
  pushSiteArray(site:SiteArray,force=false){
    let arraySite:any;
    return new Promise<any>((resolve,reject)=>{
      if(force){
        arraySite = <Site>{};
        arraySite.data = site;
        arraySite.array = [];
        arraySite.array.push(site);
        //console.log("ARRAY SITE",arraySite);
        this.updateSiteArray(arraySite).then(siteCallback=>{
            resolve(siteCallback);
        });
      }else{
        this.getSiteArray().then(callback=>{
          if(callback){
            arraySite = callback;
          }else{
            arraySite = <Site>{};
            arraySite.data = site;
            arraySite.array = [];
          }
          arraySite.array.push(site);
          this.updateSiteArray(arraySite).then(siteCallback=>{
            resolve(siteCallback);
          });
        })
      }
    });
  }
  getSiteArray(update=false){
    return new Promise<any>((resolve, reject) => {
      this.getConfigApp().then(config=>{
        this.storage.get(config.app+this.siteArray).then(site=>{
          if(update){
            this.updateMainSiteArray(site).then(callback=>{
              resolve(callback);
            })
          }else{
            resolve(site);
          }
        });
      });
    });
  }
  updateSiteArray(site:Site){
    return new Promise<any>((resolve, reject) => {
       this.setSiteArray(site).then(save=>{
          if(save){
            this.getSite().then(number=>{
              if(!number){
                this.updateMainSiteArray(site).then(callback=>{
                  resolve(callback);
                })
              }else{
                resolve(site);
              } 
            });
          }else{
            resolve(0);
          }
        });
    });
  }
  updateMainSiteArray(site:Site){
    return new Promise<any>((resolve, reject) => {
      if(site){
        let mainSite = site.data.site || false;
        if(mainSite){
          this.setSite(mainSite).then(callback=>{
             resolve(site);
          });
        }else{
           resolve(0);
        }
      }else{
        resolve(site);
      }
    });
  }
  setSiteArray(site:Site){
    return new Promise<any>((resolve, reject) => {
      this.getConfigApp().then(config=>{
        this.storage.set(config.app+this.siteArray,site).then(callback=>{
          resolve(1);
        });
      });
    });
  }



  //Check Table Site
  setCheckTable(status:any){
    return new Promise<any>((resolve, reject) => {
      this.getSite().then(site=>{
        this.getConfigApp().then(config=>{
          this.storage.set(config.app+"_"+site+this.localCheckTable,status).then(callback=>{
              resolve(1);
          });
        });
      });
      
    });
  }
  getCheckTable(){
    return new Promise<any>((resolve, reject) => {
      this.getSite().then(site=>{
        this.getConfigApp().then(config=>{
          this.storage.get(config.app+"_"+site+this.localCheckTable).then(status=>{
             resolve(status);
          });
        });
      });
    });
  }
  checkTable(force=false){
      let aleready = (loader:any) =>{
      return new Promise<any>((resolve,reject)=>{
        this.getSite().then(site=>{
          this.getConfigApp().then(config=>{
            let tableNotHave = <any>[];
            let table = (config[config.app].json_table).slice();
            let ref = firebase.database().ref().child(site);
            this.checkFirebaseTable(table,ref,tableNotHave).then(notHave=>{
                if(notHave.length > 0){
                  loader.dismiss().then((callback:any)=>{
                    let btn = false;
                    let err="";
                    notHave.forEach((text:any)=>{
                      err = err+text+" ";
                    });
                    let alert = this.alertCtrl.create({
                        title: 'Attention',
                        subTitle: 'Data Json '+err+' Not Created Do You want to Create!?',
                        buttons: [{
                            text: 'Yes',
                            handler: () => {
                              btn = true;
                              this.createFirebaseTable(notHave,site).then(callback=>{
                                resolve(1);
                              })
                            }
                         },{
                            text: 'No',
                            handler: () => {
                            }
                         }]
                    });
                    alert.onDidDismiss(() => {
                      if(!btn){
                        this.setCheckTable(false).then(callback=>{
                          resolve(1);
                        });
                      }
                    })
                    alert.present();
                  });
                }else{
                  loader.dismiss().then((callback:any)=>{
                    resolve(1);
                  })
                }
            })
           })
        });
      })
    };
    let process = () =>{
      return new Promise((resolve,reject)=>{
        let loader = this.loadingCrtl.create();
        loader.setContent(this.textLoadingCheckDatabase);
        loader.present();
        //console.log("process");
       
        //console.log("callback");
        this.loadTheme({}).then(callback=>{
          aleready(loader).then(callback=>{
            resolve(1);
          });
        });
        
      });
    }
    return new Promise<any>((resolve,reject) => {
        
        if(force){
            process().then(callback=>{
              resolve(callback);
            });
        }else{
          this.getCheckTable().then(status=>{
            if(status){
              resolve(1);
            }else{
              process().then(callback=>{
                resolve(callback);
              });
            }
          });
          
        }   
    });
  }
  checkFirebaseTable(tableCheck:any,ref:any,notHave:any){
    return new Promise<any>((resolve,reject)=>{
      let data = tableCheck[tableCheck.length - 1];
      let tableDb = ref.child(this.tableRef+data);
      tableDb.once('value').then((snap:any)=>{
        if(!snap.val()){
          notHave.push(data);
        }
        tableCheck.pop();
        if(tableCheck.length == 0){
          this.setCheckTable(true).then(callback=>{
            resolve(0);
          });
        }else{
          this.checkFirebaseTable(tableCheck,ref,notHave).then(callback=>{
            resolve(notHave);
          });
        }
      });
    })
  }
  createFirebaseTable(tableCreate:any,site:any,devMode=this.devMode){
    let data = tableCreate[tableCreate.length - 1];
    let loader = this.loadingCrtl.create();
    loader.setContent("Create "+data+" ...");
    loader.present();
    return new Promise<any>((resolve,reject)=>{
      if(devMode){
        let ref = firebase.database().ref().child(site);
        let tableDb = ref.child(this.tableRef+data);
        tableDb.set(true).then((callback:any)=>{
          tableCreate.pop();
          if(tableCreate.length == 0){
            loader.dismiss().then(callback=>{
              this.setCheckTable(true).then(callback=>{
                resolve(1);
              })
            });
          }else{
            loader.dismiss().then(callback=>{
              this.createFirebaseTable(tableCreate,site,true).then(callback=>{
                  resolve(tableCreate);
              });
            });
          }
        });
      }else{
        this.http.get('https://seven.co.th/domains/firebase/create_firebase/'+site+'/'+data)
        .subscribe(data => {
          tableCreate.pop();
          if(tableCreate.length == 0){
            loader.dismiss().then(callback=>{
              this.setCheckTable(true).then(callback=>{
                resolve(1);
              });
            });
          }else{
            loader.dismiss().then(callback=>{
              this.createFirebaseTable(tableCreate,site).then(callback=>{
                  resolve(tableCreate);
              });
            });
          }
         },er=>{
            loader.dismiss().then(callback=>{
              let alert = this.alertCtrl.create({
                      title: 'Attention',
                      subTitle: this.textErrorConnect,
                      buttons: [{
                          text: 'Yes',
                          handler: () => {
                          }
                       }]
              });
              alert.present();
              resolve(1);
            });
          });
        }
      });
  }


  //Theme
  loadTheme({force=false,load=false}){
    let loading = this.loadingCrtl.create();
    loading.setContent(this.textLoadingTheme);
    return new Promise<any>((resolve,reject)=>{
      this.getTheme().then(theme=>{
        if(theme){
          resolve(1);
        }else{
          if(this.network.type && this.network.type == "none"){
            resolve(0);
            let alert = this.alertCtrl.create({
                    title:"Attention",
                    message:textInternetConnectOffline,
                    buttons:[{
                      text:"ok"
                    }]
            });
            alert.present();
          }
          if(load){
            loading.present();
          }
          this.getSite().then(site=>{
            if(site){
              let ref = firebase.database().ref().child(site);
              ref.child('app_setting').once('value').then((snap:any)=>{
                if(snap.val()){
                  //console.log("THEME",snap.val());
                  if(ImgCache.ready){
                    ImgCache.cacheFile(snap.val().setting_logo?snap.val().setting_logo:false,data=>{
                      this.setTheme(snap.val()).then(callback=>{
                        loading.dismiss().then(callback=>{
                          resolve(1);
                        });
                      });
                    },err=>{
                      this.setTheme(snap.val()).then(callback=>{
                        loading.dismiss().then(callback=>{
                          resolve(1);
                        });
                      });
                    });
                  }else{
                    this.setTheme(snap.val()).then(callback=>{
                      loading.dismiss().then(callback=>{
                        resolve(1);
                      });
                    });
                  }
                }else{
                  loading.dismiss().then(callback=>{
                    this.setTheme({theme:false}).then(callback=>{
                      resolve(1);
                    });
                  });
                }
              }).catch((err:any)=>{
                loading.dismiss().then(callback=>{
                    resolve(1);
                });
              });
            }else{
              loading.dismiss().then(callback=>{
                    resolve(1);
              });
            }
          });
        }
      });
      
    });
  }
  setTheme(theme:any){
    return new Promise((resolve,reject)=>{
      this.getSite().then(site=>{
        this.storage.set(site+this.theme,theme).then(callback=>{
          resolve(1);
        });
      })
    });
  }
  getTheme(){
    return new Promise((resolve,reject)=>{
      this.getSite().then(site=>{
        this.storage.get(site+this.theme).then(callback=>{
          resolve(callback);
        });
      })
    });
  }
  test(){
    alert("test");
  }
  imageLog(){
    console.log(ImgCache);
  }
  anfire(){
    //console.log(firebase);

    firebase.database().ref().child('test').once('value').then(snap=>{
      console.log(snap.val());
    });

    //console.log(this.af);
  }
  testObject(){
    // let obj = this.af.object('test').valueChanges();
    // obj.subscribe((data)=>{
    //   console.log(data);
    // });
  }
  imageInit(){
    return new Promise((resolve,reject)=>{
      ImgCache.init(function(){
        
        console.log("success!");
        resolve(1);
      },function(){
        
        console.log("fail!");
        resolve(0);
      })
    });
  }

  langTh(){
    this.translate.use('th');
  }
}
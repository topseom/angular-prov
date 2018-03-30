import {Injectable,Inject} from "@angular/core";
import {Storage} from '@ionic/storage';
import { HttpClient } from '@angular/common/http';
import { Network } from '@ionic-native/network';
import {AlertController,LoadingController,ToastController} from 'ionic-angular';

import { DataService } from './data-service';
import { AuthService } from './auth-service';
import { StorageService } from './storage-service';
import { SiteArray,Site,SiteStorage } from './site-storage';


import 'rxjs/add/operator/take';
import * as tsfirebase from 'firebase';
import 'firebase/firestore';

const firebase = tsfirebase;

import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { TranslateService } from '@ngx-translate/core';

import * as ImgCache from 'imgcache.js';


import { App } from '../../config/app';
import { textInternetConnectOffline,baseUrl,firebaseController,dbFirestore,dbFirebase } from './interface';

let setting = App;



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

  demo_mobile = false;

  textLoadingCheckDatabase = "check database .."; 
  textLoadingSiteRef ="Loading ...<br>(Ref)";
  textLoadingTheme = "Loading Theme...";
  textErrorConnect = "Can't Connect Database";

  constructor(@Inject('config') private config:any,public _data:DataService,private network: Network,public translate: TranslateService,public platform: Platform,public statusBar: StatusBar,public splashScreen: SplashScreen,private http: HttpClient,public storage: StorageService,public toastCtrl:ToastController,public alertCtrl:AlertController,public loadingCrtl:LoadingController,public _siteStore:SiteStorage,public _auth:AuthService) {
    setting.demo = config.demo === false?config.demo:setting.demo;
    setting.platform = config.platform?config.platform:setting.platform;
    setting[setting.app].database = config.database?config.database:setting[setting.app].database;
    this.demo_mobile = setting.platform == "mobile" && setting.demo;
  }
  
  async getConfigApp(){
    return await this.config?this.config:App;
  }

  //Config App
  async setRoot(config:RootConfig){

    let getCacheSiteWeb = async(site:any) =>{
      let config = await this.getConfigApp();
      let cache = await this.storage.getLocal(this.siteWeb);
      if(cache && cache[site]){
        return site;
      }
      return 0;
    }

    let setCacheSiteWeb = async(site:any) =>{
      let config = await this.getConfigApp();
      let cache = await this.storage.getLocal(this.siteWeb);
      if(cache){
        cache[site] = true;
        site = cache;
      }else{
        let object = <any>{};
        object[site] = true;
        site = object;
      }
      await this.storage.setLocal(this.siteWeb,site);
      return site;
    }

    let authSite = async(site:any) =>{
        if(site){
          let loader = this.loadingCrtl.create();
          loader.setContent(this.textLoadingSiteRef);
          loader.present();
          
          let ref = await this._data.site_ref({ref:site});
          if(ref){
            await setCacheSiteWeb(site);
            return site;
          }
          /*let ref = firebase.database().ref().child("SITE/ref_list/"+site);
          let snapshot = await ref.once('value');
          await loader.dismiss();
          if(snapshot.val()){     
            await setCacheSiteWeb(site);
            return site;
          }*/
        }
        return 0;
    }

    let returnRoot = async(site="") =>{
      let callbackRoot = new CallbackSetRoot();
      if(this.demo_mobile){
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
        let user = await this._auth.getUser();
        if(user){
          callbackRoot.auth = true;
        }
        return callbackRoot;
      }else if(config.user && config.site){
        if(config.siteArray){
          callbackRoot.setSite = true;
          await this._siteStore.pushSiteArray({ site: config.siteArray,title: "",domain:""},true);
          await this.setSite(site || config.siteArray);
          let user = await this._auth.getUser();
          if(user){
            callbackRoot.auth = true;
          }
          return callbackRoot;
        }
        await this.setSite(site || config.site);
        let user = await this._auth.getUser();
        if(user){
          callbackRoot.auth = true;
        }
        callbackRoot.setSite = true;
        return callbackRoot;
      }else if(!config.user && config.site){
        if(config.siteArray){
          callbackRoot.setSite = true;
          await this._siteStore.pushSiteArray({site: config.siteArray,title: "",domain:""},true);
          await this.setSite(site || config.siteArray);
          return callbackRoot;
        }
        await this.setSite(site || config.site);
        callbackRoot.setSite = true;
        return callbackRoot;
      }
      return callbackRoot;
    }

    let getSiteUrl = async() =>{
        let name = "site";
        let url = location.href;
        name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
        var regexS = "[\\?&,]"+name+"=([^&,#]*)";
        var regex = new RegExp( regexS );
        var results = regex.exec( url );
        let site = await getCacheSiteWeb(results == null ? null : results[1]);
        if(site){
          return site;
        }
        let callback = await authSite(results == null ? null : results[1]);
        return callback;
    }

    let app = await this.getConfigApp();
    app = app.platform;
    if(app == "web"){
      let site = await getSiteUrl();
      if(site){
        let callback = await returnRoot(site);
        return callback;
      }
    }
    let callback = await returnRoot();
    return callback;
  }
  
  selectLanguage(lang:any){
    this.translate.use(lang);
  }

  async appInit(){
    this.translate.setDefaultLang('en');
    ImgCache.init();
    await this.platform.ready();
    this.statusBar.styleDefault();
    this.statusBar.overlaysWebView(false);
    this.splashScreen.hide();
    return 1;
  }

  //Main Site
  async setSite(site: string){
    let config = await this.getConfigApp();
    if(this.checkCreateTable){
      await this._siteStore.setSite(site);
      let checked = await this.checkTable(this.devMode);
      if(checked){
        return 1;
      }
      return 0;
    }
    await this._siteStore.setSite(site);
    if(config.platform == "web"){
      await this.loadTheme({load:false});
      return 1;
    }
    await this.loadTheme({load:true});
    return 1;
  }
  
  
  //Check Table Site
  async setCheckTable(status:any){
    return await this.storage.setLocal(this.localCheckTable,status);
  }

  async getCheckTable(){
    return await this.storage.getLocal(this.localCheckTable);
  }

  async checkTable(force=false){
    let aleready = async (loader:any) =>{
        let site = await this._siteStore.getSite();
        let config = await this.getConfigApp();
        let tableNotHave = <any>[];
        let table = (config[config.app].json_table).slice();
        let ref = firebase.database().ref().child(site);
        let notHave = await this.checkFirebaseTable(table,ref,tableNotHave);
        if(notHave.length > 0){
          await loader.dismiss();
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
                handler: async() => {
                  btn = true;
                  await this.createFirebaseTable(notHave,site);
                  return 1;
                }
             },{
                text: 'No',
                handler: () => {
                }
             }]
          });
          alert.onDidDismiss(async() => {
            if(!btn){
              await this.setCheckTable(false);
              return 1;
            }
          })
          alert.present();
        }else{
          await loader.dismiss();
          return 1;
        }
    };
    let process = async() =>{
      let loader = this.loadingCrtl.create();
      loader.setContent(this.textLoadingCheckDatabase);
      loader.present();
      await this.loadTheme({});
      await aleready(loader);
      return 1;
    };
    if(force){
      let callback = await process();
      return callback;
    }
    let status = await this.getCheckTable();
    if(status){
      return 1;
    }
    let callback = await process();
    return callback;
  }

  async checkFirebaseTable(tableCheck:any,ref:any,notHave:any){
    let data = tableCheck[tableCheck.length - 1];
    let tableDb = ref.child(this.tableRef+data);
    let snap = await tableDb.once('value');
    if(!snap.val()){
      notHave.push(data);
    }
    tableCheck.pop();
    if(tableCheck.length == 0){
      await this.setCheckTable(true);
      return 0;
    }
    await this.checkFirebaseTable(tableCheck,ref,notHave);
    return notHave;
  }

  async createFirebaseTable(tableCreate:any,site:any,devMode=this.devMode){
    let data = tableCreate[tableCreate.length - 1];
    let loader = this.loadingCrtl.create();
    loader.setContent("Create "+data+" ...");
    loader.present();
    if(devMode){
      let ref = firebase.database().ref().child(site);
      let tableDb = ref.child(this.tableRef+data);
      let callback = await tableDb.set(true);
      tableCreate.pop();
      if(tableCreate.length == 0){
        await loader.dismiss();
        await this.setCheckTable(true);
        return 1;
      }
      await loader.dismiss();
      await this.createFirebaseTable(tableCreate,site,true);
      return tableCreate;
    }else{
      try{
        await this.http.get(baseUrl+firebaseController+'create_firebase/'+site+'/'+data).toPromise();
        tableCreate.pop();
        if(tableCreate.length == 0){
          await loader.dismiss();
          await this.setCheckTable(true);
          return 1;
        }else{
          await loader.dismiss();
          await this.createFirebaseTable(tableCreate,site);
          return tableCreate;
        }
      }catch(e){
        await loader.dismiss();
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
        return 1;
      }
    }
  }

  //Theme
  async loadTheme({force=false,load=false}){
    let loading = this.loadingCrtl.create();
    loading.setContent(this.textLoadingTheme);
    let theme = await this.getTheme();
    if(theme && !force){
      return 1;
    }else{
      if(this.network.type && this.network.type == "none"){
        let alert = this.alertCtrl.create({
          title:"Attention",
          message:textInternetConnectOffline,
          buttons:[{
            text:"ok"
          }]
        });
        alert.present();
        return 0;
      }
      if(load){
        loading.present();
      }
      
      try{
          let theme = await this._data.app_setting({load:false});
          if(theme){
            if(ImgCache.ready){
              await ImgCache.cacheFile(theme.setting_logo?theme.setting_logo:false,async data=>{
                return 1;
              },async err=>{
                console.log("Error1",err);
                return 1;
              });
            }
            await this.setTheme(theme);
            await loading.dismiss();
            return 1;
          }
          await loading.dismiss();
          await this.setTheme({theme:false});
          return 1;
      }catch(e){
          console.log("Error2",e);
          await loading.dismiss();
          return 1;
      }
      
    }
  }
  async setTheme(theme:any){
    return await this.storage.setLocal(this.theme,theme);
  }

  async getTheme(){
    return await this.storage.getLocal(this.theme);
  }
  
}
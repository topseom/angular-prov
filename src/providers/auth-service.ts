import { Injectable } from "@angular/core";
import { AngularFireDatabase } from 'angularfire2/database';
import { SiteStorage  } from './site-storage';
import { QueryService } from './query-service';
import { InsertService } from './insert-service';
import { DataService } from './data-service';
import { ToastController } from 'ionic-angular';
import { StorageService} from './storage-service';
import 'rxjs/add/operator/take'
import * as tsfirebase from 'firebase/app';

import { AngularFireAuth } from 'angularfire2/auth';
const firebase = tsfirebase;

import * as tssha1 from 'js-sha1';
const sha1 = tssha1;

import {AlertController,LoadingController} from 'ionic-angular';
import { Facebook,FacebookLoginResponse } from '@ionic-native/facebook';
import { GooglePlus } from '@ionic-native/google-plus';



import { dbFirebase,dbMysql,dbFirestore } from './interface';

@Injectable()
export class AuthService {
  user = "user";

  textToastAddSite = "Add Site!";
  textToastWrongDomain = "Wrong Domain Name";
  textToastDomainRepeat = "Domain is Repeat!";
  textToastLogout = "Logout complete!";
  textToastRegisterSuccess = "Register Success!";
  textToastRegisterSameEmail = "Error : This Email is Repeat!";
  textAlertFillDomain = "Please Fill Domain";
  textAlertNotFoundSite = "Not Found Site!";
  textAlertWrongUserPassword = "Wrong User or Password";
  textAlertFilUserPassword = "Please Fill User or Password";
  textAlertCannotPermissions = "This Users Not have permission";
  constructor(public afauth:AngularFireAuth,public _data:DataService,public _query:QueryService,public _insert:InsertService,public _siteStore:SiteStorage,public af: AngularFireDatabase,public googleplus: GooglePlus,private fb: Facebook,public toastCtrl:ToastController, public storage: StorageService, public alertCtrl:AlertController,public loadingCrtl:LoadingController) {
  }

  async getUser(){
    let user = await this.storage.getLocal(this.user);
    if(user){
      return user;
    }
    return 0;
  }

  async fbLogin(){
    if(Facebook['installed']()){
      let res = await this.fb.login(['public_profile', 'user_friends', 'email']);
      if(res){
        let loader = this.loadingCrtl.create();
        loader.present(); 
        let userId = res.authResponse.userID;
        let params = new Array<string>();
        try{
          let user = await this.fb.api("/me?fields=name,gender,email", params);
          if(user){
            user.picture = "https://graph.facebook.com/" + userId + "/picture?type=large";
            let success = await this.insertUserProvider(user,"facebook",false);
            await loader.dismiss();
            return 1;
          }
          await loader.dismiss();
          return 0;
        }catch(e){
          await loader.dismiss();
          return 0;
        }
      }
      return 0;
    }else{
      try{
        let provider = new firebase.auth.FacebookAuthProvider();
        let user = await this.afauth.auth.signInWithPopup(provider);
        let success = await this.insertUserProvider(user,"facebook");
        return 1;
      }catch(e){
        console.log(e.message);
      }
      return 0;
    }
  }

  async googleLogin(){
    if(GooglePlus['installed']()){
      let loader = this.loadingCrtl.create();
      loader.present(); 
      try{
        let user = await this.googleplus.login({});
        if(user){
        let success = await this.insertUserProvider(user,"google",false);
        await loader.dismiss();
        return 1;
        }
        await loader.dismiss();
        return 0;
      }catch(e){
        await loader.dismiss();
        return 0;
      }
    }else{
      try{
        let provider = new firebase.auth.GoogleAuthProvider();
        let user = await this.afauth.auth.signInWithPopup(provider);
        let success = await this.insertUserProvider(user,"google");
        return 1;
      }catch(e){
        console.log(e.message);
      }
      return 0;
    }
  }
  
  async insertUserProvider(data,provider,loading=true){
    let loader = this.loadingCrtl.create();
    if(loading){
       loader.present(); 
    }
    let site = await this._siteStore.getSite();
    let ref = firebase.database().ref().child((site as any));
    let hash = sha1(data['email']+provider);
    data['id'] = hash;
    let users = ref.child('users_single/'+hash);
    let snap = await users.once('value');
    if(snap.val() != null){
      await loader.dismiss();
      await this.setUser(data);
      return 1;
    }
    try{
      await users.set(data);
      await loader.dismiss();
      await this.setUser(data);
      return 1;
    }catch(e){
      await loader.dismiss();
      return 0;
    }
  }

  async insertUserEmail({email,password,profile,database="",load=true}){
    if(database == dbFirebase || database == dbFirestore){
      profile['salt'] = Math.random().toString(36).substring(7);
      password = sha1(password+profile['salt']);
      return await this._insert.users_single({email,password,profile,load,database});
    }
    return await this._insert.users_single({email,password,load,profile});
  }

  async setUser(data){
    let callback = await this.storage.setLocal(this.user,data);
    if(callback){
      return 1;
    }
    return 0;
  }

  async authSite(domain:string,type="list",change_site=false):Promise<any>{
    if(domain){
      let loader = this.loadingCrtl.create();
      loader.present(); 
      let notRepeat = await this._siteStore.checkRepeatSiteArray(domain);
      if(notRepeat || change_site){
        var protomatch = /^(https?|ftp):\/\//;
        domain = domain.replace(protomatch,'');
        domain = domain.replace('/','');
        let hash = sha1(domain);
        let snap = await this._data.site_domain({domain,load:false});
        if(snap != null){
          await loader.dismiss();
          let siteRef = snap.ref;
          let siteTitle = snap.name || "Anonymous" ;
          let siteDomain = snap.domain;
          let item;
          if(siteRef && siteDomain){
            if(type == "list"){
              item = { site:siteRef,title:siteTitle,domain:siteDomain };
              let array = await this._siteStore.pushSiteArray(item,change_site);
              if(array){
                let toast = this.toastCtrl.create({
                  message:this.textToastAddSite,
                  duration:500,
                  position:"top"
                })
                toast.present();
                return array;
              }
              return 0;
            }else if(type == "object"){
              let callback = await this._siteStore.setSite(siteRef);
              let toast = this.toastCtrl.create({
                message:this.textToastAddSite,
                duration:500,
                position:"top"
              })
              toast.present();
              return 1;
            }
          }
          return 0;
        }
        await loader.dismiss();
        let alert = this.alertCtrl.create({
          message:this.textToastWrongDomain,
          buttons:[{
            text:"Ok"
          }]
        });
        alert.present();
        return Promise.reject({message:this.textToastWrongDomain});
      }
      await loader.dismiss();
      let toast = this.toastCtrl.create({
        message:this.textToastDomainRepeat,
        duration:500,
        position:"top"
      });
      toast.present();
      return Promise.reject({message:this.textToastDomainRepeat});
    }
    let alert = this.alertCtrl.create({
      message:this.textAlertFillDomain,
      buttons:[{
        text:"Ok"
      }]
    });
    alert.present();
    return Promise.reject({message:this.textAlertFillDomain});
  }

  async login(user,password,permissions=[]){
    if(user && password){
      let hash = sha1(user);
      let callback;
      try{
        callback = await this._data.user_login({email:user,password:password,load:true});
      }catch(e){
        //console.log(e);
        let alert = this.alertCtrl.create({
          message:this.textAlertWrongUserPassword,
          buttons:[{
            text:"Ok"
          }]
        });
        alert.present();
        return Promise.reject({message:e.message});
      }

      if(callback && this._query.getDatabase() == dbFirebase || callback && this._query.getDatabase() == dbFirestore){
        //console.log(callback);
        let input = sha1(password+callback.salt);
        if(input === callback.password){

          if(permissions['group_id'] && !permissions['group_id'].find(data=>data === callback.group_id)){
            let alert = this.alertCtrl.create({
              message:this.textAlertCannotPermissions,
              buttons:[{
                text:"Ok"
              }]
            });
            alert.present();
            return Promise.reject({message:this.textAlertCannotPermissions});
          }
          await this.storage.setLocal(this.user,callback);
          return 1;

        }
      }else if(callback && callback.user && this._query.getDatabase() == dbMysql){
        await this.storage.setLocal(this.user,callback.user);
        return 1;
      }
      //console.log("CALLBACK",callback);
      let alert = this.alertCtrl.create({
      message:this.textAlertWrongUserPassword,
        buttons:[{
          text:"Ok"
        }]
      });
      alert.present();
      return Promise.reject({message:this.textAlertWrongUserPassword});
    }
    let alert = this.alertCtrl.create({
    message:this.textAlertFilUserPassword,
        buttons:[
        {
          text: 'Ok'
        }]
    });
    alert.present();
    return Promise.reject({message:this.textAlertFilUserPassword});
  }

  async logout(){
    await this.storage.removeLocal(this.user);
    let toast = this.toastCtrl.create({
      message:this.textToastLogout,
      duration:500,
      position:"top"
    })
    toast.present();
    return 1;
  }

}

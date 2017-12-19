import { Injectable } from "@angular/core";
import { AngularFireDatabase } from 'angularfire2/database';
import { StorageService } from './storage-service';
import { QueryService } from './query-service';
import {ToastController} from 'ionic-angular';
import {SiteService} from './site-service';
//import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/take'
import * as tsfirebase from 'firebase/app';
const firebase = tsfirebase;

import * as tssha1 from 'js-sha1';
const sha1 = tssha1;

import {AlertController,LoadingController} from 'ionic-angular';

import { AuthService as AuthSocial} from "angular4-social-login";
import { FacebookLoginProvider, GoogleLoginProvider } from "angular4-social-login";
import { Facebook,FacebookLoginResponse } from '@ionic-native/facebook';
import { GooglePlus } from '@ionic-native/google-plus';

//import { App } from '../config/app';
//let setting = App;


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
  
  dbFirebase = "firebase";
  dbMysql = "json";

  constructor(public _query:QueryService,public _site:SiteService,public af: AngularFireDatabase,public googleplus: GooglePlus,private fb: Facebook,public authSocial:AuthSocial,public toastCtrl:ToastController, public storage: StorageService, public alertCtrl:AlertController,public loadingCrtl:LoadingController) {
  }
  getUser(){
    return new Promise((resolve,reject)=>{
          this.storage.getLocal(this.user).then(user=>{
            if(user){
              resolve(user);
            }else{
              resolve(0);
            }
          });
    })
  }

  fbLogin(){
    return new Promise((resolve,reject)=>{
      if (Facebook['installed']()) {
        this.fb.login(['public_profile', 'user_friends', 'email'])
        .then((res: FacebookLoginResponse) =>{ 
          if(res){
            let loader = this.loadingCrtl.create();
            loader.present(); 
            let userId = res.authResponse.userID;
            let params = new Array<string>();
            this.fb.api("/me?fields=name,gender,email", params).then(user=>{
                if(user){
                  user.picture = "https://graph.facebook.com/" + userId + "/picture?type=large";
                  this.insertUserProvider(user,"facebook",false).then(success=>{  
                      loader.dismiss().then(callback=>{
                        resolve(1);
                      });
                  });
                }else{
                  loader.dismiss().then(callback=>{
                    resolve(0);
                  });
                }
             
            },err=>{
              loader.dismiss().then(callback=>{
                resolve(0);
              });
            }).catch(err=>{
              loader.dismiss().then(callback=>{
                resolve(0);
              });
            });
          }
         })
        .catch(e => {
          alert(JSON.stringify(e));
        });
      }else{
        this.authSocial.signIn(FacebookLoginProvider.PROVIDER_ID).then(callback=>{
          if(callback){
            this.insertUserProvider(callback,"facebook").then(success=>{
              if(success){
                resolve(1);
              }
            });
          }else{
            resolve(0)
          }
        },err=>{
          resolve(0)
        }).catch(err=>{
          resolve(0)
        });
      }
    });
  }

  googleLogin(){
    return new Promise((resolve,reject)=>{
      if (GooglePlus['installed']()) {
        let loader = this.loadingCrtl.create();
        loader.present(); 
        this.googleplus.login({
        }).then((user) => {
           if(user){
              this.insertUserProvider(user,"google",false).then(success=>{  
                      loader.dismiss().then(callback=>{
                        resolve(1);
                      });
              });
           }else{
             loader.dismiss().then(callback=>{
               resolve(0);
             });
           }
        }, error => { 
            loader.dismiss().then(callback=>{
               resolve(0);
            });
        }).catch(err=>{
            loader.dismiss().then(callback=>{
               resolve(0);
            });
        });
      }else{
       this.authSocial.signIn(GoogleLoginProvider.PROVIDER_ID).then(callback=>{
          if(callback){
            this.insertUserProvider(callback,"google").then(success=>{
              if(success){
                resolve(1);
              }
            });
          }else{
            resolve(0);
          }
        },err=>{
          resolve(0);
        }).catch(err=>{
          resolve(0);
        });
      }
    });
  }

  /*setUserWebFb(data){
    return new Promise<any>((resolve,reject)=>{
      this.setUser(data).then(callback=>{
        if(callback){
          resolve(1);
        }else{
          resolve(0);
        }
      });
    });
  }*/

  insertUserProvider(data,provider,loading=true){
    let loader = this.loadingCrtl.create();
    if(loading){
       loader.present(); 
    }
    return new Promise<any>((resolve,reject)=>{
      this._site.getSite().then(site=>{
        let ref = firebase.database().ref().child((site as any));
        let hash = sha1(data['email']+provider);
        data['id'] = hash;
        let users = ref.child('users_single/'+hash);
        users.once('value').then(snap=>{
          if(snap.val() != null){
            loader.dismiss().then(load=>{
              this.setUser(data).then(callback=>{
                resolve(1);
              });
            });
          }else{
            users.set(data).then(callback=>{
              loader.dismiss().then(load=>{
                this.setUser(data).then(callback=>{
                  resolve(1);
                });
              });
            },err=>{
              loader.dismiss();
              resolve(0);
            }).catch(err=>{
              loader.dismiss();
              resolve(0);
            });
          }
        });
        //resolve(1);
      });
    });
  }

  insertUserEmail(data){
    let loader = this.loadingCrtl.create();
    loader.present(); 
    return new Promise<any>((resolve,reject)=>{
      this._site.getSite().then(site=>{
          if(site){
            let ref = firebase.database().ref().child((site as any));
            let hash = sha1(data['email']);
            data['id'] = hash;
            let users = ref.child('users_single/'+hash);
            users.once('value').then(snap=>{
              if(snap.val() != null){
                loader.dismiss().then(callback=>{
                  let toast = this.toastCtrl.create({
                      message:this.textToastRegisterSameEmail,
                      duration:1000,
                      position:"top"
                  })
                  toast.present();
                  resolve(0);
                  /*this.setUser(data).then(callback=>{
                    resolve(1);
                  });*/
                });
              }else{
                data['salt'] = Math.random().toString(36).substring(7);
                data['password'] = sha1(data['password']+data['salt']);
                users.set(data).then(callback=>{
                  loader.dismiss().then(load=>{
                    let toast = this.toastCtrl.create({
                      message:this.textToastRegisterSuccess,
                      duration:200,
                      position:"top"
                    })
                    toast.present();
                    resolve(1);
                    /*this.setUser(data).then(callback=>{
                      resolve(1);
                    });*/
                  });
                },err=>{
                  loader.dismiss();
                  resolve(0);
                }).catch(err=>{
                  loader.dismiss();
                  resolve(0);
                });
              }
            });
          }
      });
    });
  }

  setUser(data){
    return new Promise<any>((resolve,reject)=>{
      this.storage.setLocal(this.user,data).then(callback=>{
        if(callback){
         resolve(1);
        }else{
         resolve(0);
        }
      });
    }); 
  }

  authSite(domain:string,type="list",change_site=false){
    let loader = this.loadingCrtl.create();
    loader.present(); 
    return new Promise<any>((resolve,reject)=>{
      if(domain){    
        this._site.checkRepeatSiteArray(domain).then(notRepeat=>{
          if(notRepeat || change_site){

              var protomatch = /^(https?|ftp):\/\//;
              domain = domain.replace(protomatch,'');
              domain = domain.replace('/','');
              let hash = sha1(domain);
              this._query.auth_site({site:hash}).then(snap=>{
                if(snap != null){
                  loader.dismiss().then(callback=>{
                    let siteRef = snap.ref;
                    let siteTitle = snap.name || "Anonymous" ;
                    let siteDomain = snap.domain;
                    let item;
                    if(siteRef && siteDomain){
                      if(type == "list"){
                        item = { site:siteRef,title:siteTitle,domain:siteDomain };
                        this._site.pushSiteArray(item,change_site).then(array=>{
                          if(array){
                            let toast = this.toastCtrl.create({
                              message:this.textToastAddSite,
                              duration:500,
                              position:"top"
                            })
                            toast.present();
                            resolve(array);
                          }else{
                            resolve(0);
                          }
                        });
                      }else if(type == "object"){
                        this._site.setSite(siteRef).then(callback=>{
                          if(callback){
                            let toast = this.toastCtrl.create({
                              message:this.textToastAddSite,
                              duration:500,
                              position:"top"
                            })
                            toast.present();
                            resolve(1);
                          }else{
                            resolve(0);
                          }
                        });
                      }else{
                        resolve(0);
                      }
                    }else{
                      resolve(0);
                    }
                  });
                }else{
                  loader.dismiss().then(callback=>{
                    resolve(0);
                    let alert = this.alertCtrl.create({
                      message:this.textToastWrongDomain,
                      buttons:[{
                        text:"Ok"
                      }]
                    });
                    alert.present();
                  });
                }
              });
            
          }else{
            loader.dismiss().then(callback=>{
              let toast = this.toastCtrl.create({
                  message:this.textToastDomainRepeat,
                  duration:500,
                  position:"top"
              });
              toast.present();
              resolve(0);
            });
          }
        });
      }else{
              resolve(0);
              loader.dismiss().then(callback=>{
                let alert = this.alertCtrl.create({
                  message:this.textAlertFillDomain,
                  buttons:[{
                    text:"Ok"
                  }]
                });
                alert.present();
              });
      }
    });
  }

  login(user,password){
    return new Promise((resolve, reject) => {
      if(user && password){
          let hash = sha1(user);
          this._query.auth_user({username:user,password:password,hash,load:true}).then(callback=>{
            if(callback && this._query.getDatabase() == this.dbFirebase){
              let input = sha1(password+callback.salt);
              if(input === callback.password){
                  this.storage.setLocal(this.user,callback).then(callback=>{
                      resolve(1);
                  });
              }else{
                  resolve(0);
                  let alert = this.alertCtrl.create({
                    message:this.textAlertWrongUserPassword,
                    buttons:[{
                      text:"Ok"
                    }]
                  });
                  alert.present();           
              }
            }else if(callback && callback.user && this._query.getDatabase() == this.dbMysql){
              this.storage.setLocal(this.user,callback.user).then(callback=>{
                 resolve(1);
              })
            }else{
              resolve(0);
              let alert = this.alertCtrl.create({
                          message:this.textAlertWrongUserPassword,
                            buttons:[{
                              text:"Ok"
                            }]
              });
              alert.present();
            }
          });
      }else{
            resolve(0);
            let alert = this.alertCtrl.create({
            message:this.textAlertFilUserPassword,
              buttons:[
              {
                text: 'Ok'
              }]
            });
            alert.present();
      }
    });
  }

  logout(){
    return new Promise((resolve, reject) => {
          this.storage.removeLocal(this.user).then(callback=>{
              let toast = this.toastCtrl.create({
                message:this.textToastLogout,
                duration:500,
                position:"top"
              })
              toast.present();
              resolve(1);
          })
    });
  }



}

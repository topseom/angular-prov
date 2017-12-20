import { Component } from '@angular/core';
//import { NavController,NavParams } from 'ionic-angular';
import { ViewController } from 'ionic-angular';
import { AuthService } from '../providers/auth-service';
import { App } from '../../config/app';
var setting = App;

@Component({
  selector:"widget-user-setting",
   template: `
    <ion-list no-lines>
        <button ion-item (click)="setting()">{{ 'setting'| translate }}</button>
        <button ion-item (click)="logout()">{{ 'logout'| translate }}</button>  
        <button ion-item *ngIf="demo" (click)="change_site()">{{"change_site" |translate}}</button>  
    </ion-list>
  `
})
export class WidgetUserSetting{
  demo = setting.demo && setting.platform =="mobile";
  constructor(public viewCtrl: ViewController,public _auth:AuthService){
    
  }
  
  ngOnInit() {
  }

  logout(){
    this._auth.logout().then((status)=>{
      if(status){
         this.viewCtrl.dismiss({event:"logout"});
      }
       
        /*if(status){
            if(this.navParams.get("logout")){
              this.navCtrl.setRoot(this.navParams.get("logout"));
            }
        }
        else{
          //alert("Error Logout");
        }*/
    });
  }
  
  change_site(){
    this.viewCtrl.dismiss({event:"change_site"});
  }

  setting(){
    //console.log(11);
    this.viewCtrl.dismiss({event:"setting"});
  }

}
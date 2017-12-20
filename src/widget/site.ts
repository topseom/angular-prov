import { Component } from '@angular/core';
import { NavParams,NavController } from 'ionic-angular';
import { AuthService } from '../providers/auth-service';

@Component({
    selector:"widget-site",
    template:`
    <ion-content>
        <ion-grid>
            <ion-row justify-content-center>
                <ion-col text-center col-sm-12 col-md-8 col-12>
                            <!--<form (ngSubmit)="add(domain)">
                                <ion-list>
                                    <ion-item>
                                        <ion-label>Enter Domain</ion-label>
                                        <ion-input type="email" #domain></ion-input>
                                    </ion-item>
                                </ion-list>
                                <button type="submit" ion-button round>add site</button>
                            </form>-->
                            <ion-list>
                                <div class="card">
                                    <div class="head_add">
                                        <h1>{{'บันทึกโดเมน' | translate }}</h1>
                                    </div> 
                                    <div class="sub_add">
                                        <form (ngSubmit)="add(site)" novalidate>
                                            <input #site placeholder="add domain name" type="email">
                                            <button type="submit" class="btn btn-default">{{ 'บันทึก' | translate }}</button>
                                        </form>
                                    </div>
                                </div>
                            </ion-list>
                </ion-col>
            </ion-row>
        </ion-grid>
    </ion-content>
      `
})
export class WidgetSite{
    type:any;
    page:any;
    constructor(public navCtrl:NavController,public param:NavParams,public _auth:AuthService){
        this.page = this.param.get("page");
        this.type = this.param.get("type") || "object";
    }

    add(domain:HTMLInputElement){
        if(domain.value){
            this._auth.authSite(domain.value,this.type,true).then(callback=>{
                if(callback && this.param.get("page")){
                    this.navCtrl.setRoot(this.param.get("page"));
                }
            });
        }
       
            
        
    }
}
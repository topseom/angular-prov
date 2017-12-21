import { Component } from '@angular/core';
import { NavParams,NavController } from 'ionic-angular';
import { AuthService } from '../providers/auth-service';

@Component({
    selector:"widget-site",
    styles:[`
    ion-content{
        background-image:url('../assets/img/global/bg_mobile.png'); 
        background-repeat:no-repeat;
        background-position:100% center;
        background-size:cover;
    }
    .card {
            position: relative;
            overflow: hidden;
            border-radius: 2px;
            padding: 60px 30px 0px;
    }
    .card ion-icon{
            cursor:pointer; font-size:30px;position: absolute;
            top: 10px; 
            left: 15px; 
            color: white;
    }

    .card .head_add{
         text-align:center; 
    }

    .card .head_add h1{
    color:#fff;
    font-size:28px;
    font-weight:normal;
    font-family:'seven_01';
    }

    .card .sub_add{
    padding: 40px 50px 0px;
    }

    .card .sub_add form label{
    padding-bottom: 20px;
    font-size: 18px;
    color:#fff; 
    }

    .card .sub_add form input{
                width: 100%;
                padding: 10px;
                border-radius:22px;
                border:1px solid #006699;
                text-align:center;
    }

    .card .sub_add button{
                margin-top: 20px;
                width:100%;
                border:none;
                border-radius:22px;
                padding:10px;
                color:#fff;
                background:#006699;
                border:1px solid #006699;
    }
    `],
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
                                        <form (submit)="add(site,$event)" novalidate>
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

   

    add(domain:HTMLInputElement,event: Event){
        event.preventDefault();
        if(domain.value){
            this._auth.authSite(domain.value,this.type,true).then(callback=>{
                if(callback && this.param.get("page")){
                    this.navCtrl.setRoot(this.param.get("page"));
                }
            });
        }
       
            
        
    }
}
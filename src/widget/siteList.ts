import { Component } from '@angular/core';
import { NavParams,ViewController } from 'ionic-angular';
import { SiteStorage } from '../providers/site-storage';

@Component({
  selector:"widget-siteList",
	template: `
    <ion-list no-lines *ngIf="siteArray" >
      <ion-row *ngFor="let site of siteArray.array">
          <ion-col>
            <button (click)="selectSite(site)" ion-item>{{ site.title }}</button>
          </ion-col>
          <ion-col width-20 style="text-align: right;">
            <button (click)="removeSite(site)" small ion-button round color="danger" style="padding: 10px;margin-top: 10px;    background-color: #d67a7a;">x</button>
          </ion-col>
      </ion-row>
      <button ion-item (click)="addSite()">{{ 'add new ref site'| translate }}</button>
    </ion-list>
  	`
})
export class WidgetSitelist{
  siteArray:any;
	constructor(public _siteStore:SiteStorage,public viewCtrl:ViewController,public params:NavParams){}

	ngOnInit(){
    this._siteStore.getSiteArray().then(callback=>{
      if(callback){
        this.siteArray = callback;
      }
    });
	}

	selectSite(site){
    this._siteStore.selectSiteArray(site).then(callback=>{
      if(callback){
        let data ={};
        data['update'] = callback;
        this.viewCtrl.dismiss(data);
      }
    });
	}
	removeSite(site,index:number){
    this._siteStore.removeSiteArray(site).then(callback=>{
      if(callback){
        let data ={};
        data['update'] = callback;
        this.viewCtrl.dismiss(data);
      }
    });
	}
	addSite(){
    let data ={};
    data['add'] = true;
    this.viewCtrl.dismiss(data);
	}


}
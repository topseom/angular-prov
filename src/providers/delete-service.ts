import { Injectable } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { SiteService } from './site-service';
import { QueryService } from './query-service';
import { LoadingController } from 'ionic-angular';
//import * as moment from 'moment';
//import * as firebase from 'firebase/app';

//dbFirebase
//dbMysql
import { Database } from './interface';

@Injectable()
export class DeleteService{
	table_order_single = "order_single";
	table_order_address = "order_address";

	constructor(public _query:QueryService,public _site:SiteService,public loadCtrl:LoadingController,public af:AngularFireDatabase){

	}
	db(database : Database){
	    return new Promise<any>((resolve, reject) => {
	      let db = database;
	      if(db.firebase){
	        //resolve(this.firebase(db.firebase));
	      }else if(db.json){
	        resolve(this.json(db.json));
	      }else{
	        resolve(0);
	      }
	    });
  }

	json(option){
	    return new Promise<any>((resolve, reject) => {
	      this._site.getSite().then(site=>{
	        if(site && option.table && option.method){
	        	let method = option.method;
	        	if(method == "get"){
		            this._query.json_get(option,site).then(callback=>{
	          			resolve(callback);
	         		});
		        }else if(method == "post"){
		            //resolve(this.json_post(option,site));
		        }else{
		            resolve(0);
		        } 
	        }else{
	          resolve(0);
	        }
	      });
	    });
  	}

  	order_address_delete(id,load=true){
  		return new Promise((resolve,reject) => {
          let query = {
            json:{
              table:"json_delete_address_firebase/"+id,
              method:"get",
              loading:load,
            }
          }
          this.db(query).then(callback=>{
            if(callback){
              resolve(callback);
            }else{
              resolve(0);
            }
          });
      });
  	}
}
import { Injectable } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { SiteService } from './site-service';
import { QueryService } from './query-service';
import { LoadingController } from 'ionic-angular';

//dbFirebase
//dbMysql
import { Database } from './interface';

@Injectable()
export class UpdateService{
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
	        if(site && option.table && option.data){
	          this._query.json_post(option,site).then(callback=>{
	          	resolve(callback);
	          });
	        }else{
	          resolve(0);
	        }
	      });
	    });
  	}

  	order_address_update(id,data,load=true){
  		return new Promise((resolve,reject)=>{
  				let insert:Database;
  				data['id'] = id;
  				insert = {
		            json:{
		              table:"json_update_address_firebase",
		              loading:load,
		              method:"post",
		              data:{
		                  data:data
		              } 
		           	}
		        }
		        this.db(insert).then(callback=>{
		        	 resolve(callback);
		        });
  		});
  	}
}
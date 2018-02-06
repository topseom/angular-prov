import { Injectable } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { SiteService } from './site-service';
import { QueryService } from './query-service';
import { LoadingController } from 'ionic-angular';
import * as tsmoment from 'moment';
const moment = tsmoment;
//import * as firebase from 'firebase/app';

//dbFirebase
import { Database,dbMysql } from './interface';

@Injectable()
export class InsertService{
	table_order_single = "order_single";
	table_order_address = "order_address";

	constructor(public _query:QueryService,public _site:SiteService,public loadCtrl:LoadingController,public af:AngularFireDatabase){

	}
 	async db(database : Database){
		let db = database;
	    if(db.firebase){
	        return await this.firebase(db.firebase);
	    }else if(db.json){
	        return await this.json(db.json);
		}
		return 0;
  	}

  	// Firebase
    async firebase(option){
		let data = option.data || false;
		let table = option.table || false;
		let loading = option.loading || false;
		let method = option.method || "push";
		let loader = this.loadCtrl.create();
		let site = await this._site.getSite();
		if(site && option.table && data){
			if(loading){
				loader.present();
			}
			let user = await this._site.getUser();
			data['created_by'] = (user as any).id || false;
			data['created'] = moment().format('YYYY-MM-DD HH:mm:ss');
			if(method == "push"){
				let callback = await this.af.list(site+"/"+table).push(data);
				await loader.dismiss();
				return callback; 
			}else if(method == "set" && data['id']){
				let callback = await this.af.object(site+"/"+table+'/'+data['id']).set(data);
				await loader.dismiss();
				return 1; 
			}
			await loader.dismiss();
			return 0;
		}
		return 0;
	}

    async json(option){
		let site = await this._site.getSite();
		if(site && option.table && option.data){
			let callback = await this._query.json_post(option,site);
			return callback;
		}
		return 0;
	}
	  
    async user_form_firebase_insert(data,type,load=true){
		let insert:Database;
		insert = {
			firebase:{
				table: "form/users/"+type,
				loading:load,
				method:"set",
				data:data
			}
		}
		let callback = await this.db(insert);
		return callback;
	}
	  
    async user_form_json_insert(data,load=true){
		let insert:Database;
		insert = {
			json:{
			  table:"json_insert_user_form",
			  loading:load,
			  method:"post",
			  data:{
				  data:data
			  } 
			   }
		}
		let callback = await this.db(insert);
		return callback;
  	}

    async user_form_insert_to_firebase(data,load=true){
		let insert:Database;
		insert = {
		  json:{
			table:"json_insert_user_form_to_firebase",
			loading:load,
			method:"post",
			data:{
				json:data['json'],
				firebase:data['firebase'],
				path:"form/users/"+data['type']
			} 
			 }
		}
		let callback = await this.db(insert);
		return callback;
	}
	  
    async user_form_insert(data,load=true){
		if(this._query.getDatabase() == dbMysql){
			let insert:Database;
			insert = {
				json:{
				  table:"json_insert_user_form",
				  loading:load,
				  method:"post",
				  data:{
					  data:data
				  } 
				}
			}
			let callback = await this.db(insert);
			return callback;
		}
		return 0;
  	}

    async order_address_insert(data){
		let insert:Database;
		insert = {
			  json:{
				table:"json_insert_address_firebase",
				loading:true,
				method:"post",
				data:{
					data:data
				} 
				 }
		}
		let callback = await this.db(insert);
		return callback;
	}

    async order_insert(data,type=""){
		let insert:Database;
		insert = {
			json:{
			  table:"json_insert_order_firebase",
			  loading:true,
			  method:"post",
			  data:{
				  data:data,
				  type:type
			  } 
			   }
		}
		let callback = await this.db(insert);
		return callback;
	}
	
}
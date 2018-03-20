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
	async db(database : Database){
			let db = database;
			if(db.firebase){
				//resolve(this.firebase(db.firebase));
			}else if(db.json){
				return(this.json(db.json));
			}
			return 0;
	}

	async json(option){
			let site = await this._site.getSite();
			if(site && option.table && option.method){
				let method = option.method;
				if(method == "get"){
					let callback = await	this._query.json_get(option,site);
					return callback;
				}else if(method == "post"){
						//resolve(this.json_post(option,site));
				}
			}
			return 0;
	}

	async order_address_delete(id,load=true){
			let query = {
				json:{
					table:"json_delete_address_firebase/"+id,
					method:"get",
					loading:load,
				}
			}
			let callback = await this.db(query);
			if(callback){
				return callback;
			}
			return 0;	
	}
}
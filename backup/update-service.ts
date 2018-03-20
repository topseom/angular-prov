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
	async db(database : Database){
			let db = database;
		if(db.firebase){
				//resolve(this.firebase(db.firebase));
		}else if(db.json){
				return await this.json(db.json);
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

	async order_address_update(id,data,load=true){
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
			let callback = await this.db(insert);
			return callback; 		
	}
	
}
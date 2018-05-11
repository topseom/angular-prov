import { Injectable } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFirestore } from 'angularfire2/firestore';
import { SiteStorage } from './site-storage';

import { QueryService,Options,Query } from './query-service';
import { LoadingController } from 'ionic-angular';
import * as tsmoment from 'moment';
const moment = tsmoment;

import { Database,dbMysql,dbFirebase,dbFirestore,table,api } from './interface';

@Injectable()
export class InsertService{

	api_version = "v1/";
	api_type = "insert/";
	lists = "/lists";
	
	constructor(public _query:QueryService,public _siteStore:SiteStorage,public loadingCtrl:LoadingController,public af:AngularFireDatabase,public afs:AngularFirestore){
	}
	
	async query(table:string,options:Options){
    return await this.db(new Query(table,options));
	}
	
 	async db(args:Query){
		console.log(args);
		let database = args.options.database?args.options.database:this._query.getDatabase();
		console.log(database);
		args.options.ref = await this._siteStore.getSite();
		args.options.api_version = args.options.api_version?args.options.api_version:this.api_version;
		args.options.api_type = args.options.api_type?args.options.api_type:this.api_type;
		args.options.table = args.options.table_path ? args.options.table+'/'+args.options.table_path : args.options.table ;
		if(!args.options.table){
      		return Promise.reject({message:"not found table",status:404});
		}
		if(!args.options.data){
			return Promise.reject({message:"not found data to save",status:404})
		}
	  	if(database == dbFirebase){
	      	return await this.firebase(args.options);
	  	}else if(database == dbFirestore){
	      	return await this.firestore(args.options);
		}else if(database == dbMysql){
			return await this._query.api(args.options);
		}
		return Promise.reject({message:"not found database",status:404});
	}

	async firebase(options:Options){
		let loader = this.loadingCtrl.create();
		if(options.loading){
      		loader.present();
		}
		try{
			if(options.method == "post"){
				await this.af.object(options.ref+"/"+options.table+'/'+options.data['id']).set(options.data);
				await loader.dismiss();
				return { id:options.data['id'] };
			}else if(options.method == "push"){
				let callback = await this.af.list(options.ref+"/"+options.table).push(options.data);
				await loader.dismiss();
				return { id:callback.key };
			}
			await loader.dismiss();
			return Promise.reject({message:"not found method api firebase to get data!",status:404});
		}catch(e){
			await loader.dismiss();
			return Promise.reject({message:"cannot insert data to firebase!",status:404});
		}
	}

	async firestore(options:Options){
		let loader = this.loadingCtrl.create();
		if(options.loading){
      		loader.present();
		}
		if(options.method == "post"){
			await this.afs.doc(options.ref+"/"+options.table+this.lists+'/'+options.data['id']).set(options.data);
			await loader.dismiss();
			return { id:options.data['id'] };
		}else if(options.method == "push"){
			let callback = await this.afs.collection(options.ref+"/"+options.table+this.lists).add(options.data);
			await loader.dismiss();
			return { id:callback.id };
		}
		await loader.dismiss();
		return Promise.reject({message:"not found method api firestore to get data!",status:404});
	}

	async user_form({data,type,other_data,load=true,database=dbMysql,other_table=table.form_users+"/"+type}){
		if(!type){ return Promise.reject({message:"not found type",status:400}); }
		if(!other_data){ return Promise.reject({message:"not found other data",status:400}); }
		return await this.query(table.form_users,new Options({ 	method:"post",api:api.user_single_insert,table_path:type,data,database,loading:load,other_data,other_table }));
	}

	async users_single({email,password,profile={},load=true,database=dbMysql }){
		return await this.query(table.users_single,new Options({ method:"push",api:api.user_single_insert,data:{email,password,...profile},database,loading:load }));
	}

	async listing_single({data,image,load=true,database=dbMysql }){
		return await this.query(table.listing_single,new Options({ method:"push",upload:true,api:api.listing_single,data:{...data,image},database,loading:load }));
	}

	async order_address({data,load=true,database=dbMysql}){
		return await this.query(table.order_single,new Options({ method:"post",api:api.order_address_update,data,database,loading:load }));
	}

	async order_single({data,type,load=true,database=dbMysql}){
		return await this.query(table.order_single,new Options({ method:"post",api:api.order_single_insert,data:{type,...data},database,loading:load }));
	}

}
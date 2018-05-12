import { Injectable } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFirestore } from 'angularfire2/firestore';
import { SiteStorage } from './site-storage';
import { QueryService,Query,Options } from './query-service';
import { LoadingController } from 'ionic-angular';

//dbFirebase
//dbMysql
import { Database,dbFirebase,dbFirestore,dbMysql,table,api,post } from './interface';

@Injectable()
export class UpdateService{

	api_version = "v1/";
	api_type = "update/";
	lists = "/lists";

	constructor(public _query:QueryService,public _siteStore:SiteStorage,public loadingCtrl:LoadingController,public af:AngularFireDatabase,public afs:AngularFirestore){

	}
	async query(table:string,options:Options){
		return await this.db(new Query(table,options));
	}

	async db(args:Query){
		let database = args.options.database?args.options.database:this._query.getDatabase();
		args.options.ref = await this._siteStore.getSite();
		args.options.api_version = args.options.api_version?args.options.api_version:this.api_version;
		args.options.api_type = args.options.api_type?args.options.api_type:this.api_type;
		args.options.table = args.options.table_path ? args.options.table+'/'+args.options.table_path : args.options.table ;
		if(!args.options.table){
      		return Promise.reject({message:"not found table",status:404});
		}
		if(!args.options.data){
			return Promise.reject({message:"not found index to delete",status:404})
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
		let clone = JSON.parse(JSON.stringify(options.data));
		delete options.data['id'];
		console.log("CLONE",clone);
		await this.af.object(options.ref+"/"+options.table+'/'+clone['id']).update(options.data);
		await loader.dismiss();
		return 1;
	}

	async firestore(options:Options){
		let loader = this.loadingCtrl.create();
		if(options.loading){
      		loader.present();
		}
		let clone = JSON.parse(JSON.stringify(options.data));
		delete options.data['id'];
		console.log("CLONE",clone);
		let data = await this.afs.firestore.doc(options.ref+"/"+options.table+this.lists+'/'+clone['id']).get();
		if(!data.exists && options.upsert){
			await data.ref.set(options.data);
		}else{
			await data.ref.update(options.data);
		}
		await loader.dismiss();
		return 1;
	}
	
	async order_address({id,update,load=true}){
		return await this.query(table.order_address,new Options({ method:post,api:api.order_address_update,data:{id,...update},database:dbMysql,loading:load }));
	}

	async listing_single({id,update,image,load=true}){
		return await this.query(table.listing_single,new Options({ method:post,upload:true,api:api.listing_single,data:{id,...update,image},database:dbMysql,loading:load }));
	}

}
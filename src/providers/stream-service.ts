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
export class StreamService{

	api_version = "v1/";
	api_type = "stream/";
	lists = "/lists";
	
	constructor(public _query:QueryService,public _siteStore:SiteStorage){
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
			return Promise.reject({message:"not found data to save",status:404})
		}
	  	if(database == dbFirebase){
	      	return await this._query.firebase(args.options);
	  	}else if(database == dbFirestore){
	      	return await this._query.firestore(args.options);
		}else if(database == dbMysql){
			return await this._query.api(args.options);
		}
		return Promise.reject({message:"not found database",status:404});
	}

	async users_single({load=true,database=dbMysql} = {}){
		return await this.query(table.users_single,new Options({ method:"post",api:api.user_single_stream,database,loading:load }));
	}

	async listing_single({id,load=true,database=dbMysql}){
		return await this.query(table.order_single,new Options({ method:"post",api:api.listing_single,data:{id},database,loading:load }));
	}
}
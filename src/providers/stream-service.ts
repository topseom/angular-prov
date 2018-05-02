import { Injectable } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { AngularFirestore } from 'angularfire2/firestore';
import { SiteStorage } from './site-storage';

import { TranslateService } from '@ngx-translate/core';
import { QueryService,Options,Query } from './query-service';
import { LoadingController } from 'ionic-angular';
import * as tsmoment from 'moment';
const moment = tsmoment;

import { Database,dbMysql,dbFirebase,dbFirestore,table,api,create,edit,post } from './interface';

@Injectable()
export class StreamService{

	api_version = "v1/";
	api_type = "stream/";
	lists = "/lists";
	
	constructor(public _query:QueryService,public _siteStore:SiteStorage,public translate:TranslateService){
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
		if(args.options.lang){
			args.options.lang_code = this.translate.currentLang || "en";
		}
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

	async users_single({load=true,database=dbMysql,withEmailPassword=false} = {}){
        let field_defaul = [{ field_slug:'email',field_type:'text',icon:'mail' },{ field_slug:'password',field_type:'password',icon:'lock' }];
        let data:Array<any> = await this.query(table.users_single,new Options({ method:post,api:api.user_single_stream,database,loading:load }));
        if(withEmailPassword){
            return[...field_defaul,...data];
        }
        return data;
	}

	async listing_single_create({category_id,load=true,database=dbMysql}){
		return await this.query(table.order_single,new Options({ method:post,api:api.listing_single,data:{id:category_id,type:create},database,loading:load }));
	}
	async listing_single_edit({listing_id,load=true,database=dbMysql}){
		return await this.query(table.order_single,new Options({ method:post,api:api.listing_single,data:{id:listing_id,type:edit},database,loading:load }));
	}

	async listing_condition({template_id,load=true,database=dbMysql}){
		return await this.query(table.listing_single,new Options({ lang:true,method:post,api:api.listing_condition,data:{id:template_id},database,loading:load }));
	}
}
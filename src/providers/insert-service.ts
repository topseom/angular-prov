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
	db(database : Database){
	    return new Promise<any>((resolve, reject) => {
	      let db = database;
	      if(db.firebase){
	        resolve(this.firebase(db.firebase));
	      }else if(db.json){
	        resolve(this.json(db.json));
	      }else{
	        resolve(0);
	      }
	    });
  	}

  	// Firebase
	firebase(option){
	    return new Promise<any>((resolve, reject) => {
	    	let data = option.data || false;
	        let table = option.table || false;
	        let loading = option.loading || false;
	        let method = option.method || "push";
	    	let loader = this.loadCtrl.create();
	        this._site.getSite().then(site=>{
	          if(site && option.table && data){
	          	if(loading){
	    			loader.present();
	    		}
	            this._site.getUser().then(user=>{
	            	data['created_by'] = (user as any).id || false;
	            	data['created'] = moment().format('YYYY-MM-DD HH:mm:ss');
	            	if(method == "push"){
	            		console.log(1);
	            		this.af.list(site+"/"+table).push(data).then(callback=>{
							loader.dismiss().then(()=>{
								resolve(callback);
							});
						},err=>{
							loader.dismiss().then(()=>{
								resolve(0);
							});
						});
	            	}else if(method == "set" && data['id']){
	            		this.af.object(site+"/"+table+'/'+data['id']).set(data).then(callback=>{
							loader.dismiss().then(()=>{
								resolve(1);
							});
						},err=>{
							loader.dismiss().then(()=>{
								resolve(0);
							});
						});
	            	}else{
	            		console.log(3);
	            		loader.dismiss().then(()=>{
							resolve(0);
						});
	            	}
	            	
	            });
	          }else{
	          	resolve(0);
	          }
	        });
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
  	user_form_firebase_insert(data,type,load=true){
  		return new Promise((resolve,reject)=>{
  			let insert:Database;
			insert = {
				firebase:{
					table: "form/users/"+type,
					loading:load,
					method:"set",
					data:data
				}
			}
			this.db(insert).then(callback=>{
				resolve(callback);
			});
  		});
  	}
  	user_form_json_insert(data,load=true){
  		return new Promise((resolve,reject)=>{
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
		    this.db(insert).then(callback=>{
		      	resolve(callback);
		    });
  		});
  	}

  	user_form_insert_to_firebase(data,load=true){
  		return new Promise((resolve,reject)=>{
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
		        this.db(insert).then(callback=>{
		        	 resolve(callback);
		        });
  		});
  	}
  	user_form_insert(data,load=true){
  		return new Promise((resolve,reject)=>{
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
		        this.db(insert).then(callback=>{
		        	 resolve(callback);
		        });
  			}else{
  				 resolve(0);
  			}
  		});
  	}

	order_address_insert(data){
		return new Promise((resolve,reject)=>{
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
		    this.db(insert).then(callback=>{
		        	 resolve(callback);
		    });
			/*if(this._query.getDatabase() == dbFirebase){
				let insert:Database;
				insert = {
					firebase:{
						table: "order_address",
						loading:true,
						data:data
					}
				}
				this.db(insert).then(callback=>{
					resolve(callback);
				});
			}else{
				resolve(0);
			}*/
		});
	}
	order_insert(data,type=""){
		return new Promise((resolve,reject)=>{
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
		    this.db(insert).then(callback=>{
		        	 resolve(callback);
		    });
			/*if(this._query.getDatabase() == dbFirebase){
				data['status'] = "Unpaid";
				let insert:Database;
				insert = {
					firebase:{
						table: "order_single",
						loading:true,
						data:data
					}
				}
				this.db(insert).then(callback=>{
					resolve(callback);
				});
			}else{
				resolve(0);
			}*/
		});
	}
}
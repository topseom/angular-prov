import { Injectable } from '@angular/core';
import { AlertController } from 'ionic-angular';
import { StorageService } from './storage-service';
import { QueryService } from './query-service';
import { dbFirebase,table } from './interface';
import * as _ from 'lodash';

export interface ConfigFilter{
	parent_key?:string,
	key:string;
	value:string | boolean;
	object?:boolean;
}

export interface Config{
	table:string;
	query:{func,param:object};
	offline?:boolean;
	filter?:ConfigFilter;
}

@Injectable()
export class DataService{
	test =[];
	constructor(public _storage:StorageService,public _query:QueryService,public alertCtrl:AlertController){}
	
	slideModuleInit(module,limit){
     return new Promise<any>((resolve,reject)=>{
       let module_slides = [];
       let index = 1;
       let begin,end = 0;
       let check = true;
       while(check){
          if(index == 1){
             begin = 0;
            end= (index*limit);
          }
          else{
            begin = ((index-1)*limit);
            end= begin+limit;
          }
          let array =[];
          for(let i=begin ;i<end;i++){
            if(module[i]){
              array.push(module[i]);
            }
          }
          if(array.length > 0){
            module_slides[index-1] = array;
          }
          index = index+1;
          if(array.length % limit != 0 || module[index] == null){
            check = false;
          }
       }
       resolve(module_slides);
     });
	}
	page_module(module){
		return new Promise<any>((resolve,reject)=>{
			if(module.module_name != "0" && module.module_name != ""){
				let title = module.module_name;
				if(title == "blog"){
					resolve({module:"blog",param:{title:module.title}});
				}else if(title == "firesale"){
					resolve({module:"firesale",param:"0"});
				}else if(title == "pro_galleries"){
					resolve({module:"gallery",param:{title:module.title}});;
				}else if(title == "portfolio"){
					resolve({module:"portfolio",param:{title:module.title}});;
				}else{
					resolve(0);
				}
			}
			else if(module.uri == "" ||  module.uri == "#"){
				if(module.children && module.children.length){
					resolve({module:"children",param:{children:module.children,title:module.title}});
				}else{
					resolve({module:"page",param:{slug:module.url_mobile,title:module.title}});
				}
			}else{
				let array = ((module as any).uri).split("/");
				if(array[0] == "blog"){
					if(array[1] == "category"){
						resolve({module:"blog_category",param:{"id":array[2],"title":module.title}});
					}else{
						resolve({module:"blog_detail",param:{"id":array[1],"title":module.title}});
					}
				}else if(array[0] == "product"){
					if(array[1] == "category"){
						resolve({module:"product_category",param:{"category_id":array[2],"title":module.title}})
					}else{
						resolve({module:"product_detail"});
					}
				}else if(array[0] == "gallery"){
					if(array[1] == "category"){
						resolve({module:"gallery_category",param:{id:array[2],title:module.title}});
					}else{
						resolve({module:"gallery_detail",param:{id:array[1],title:module.title}});
					}
				}else if(array[0] == "portfolio"){
					if(array[1] == "category"){
						resolve({module:"portfolio_category",param:{id:array[2],title:module.title}});
					}else if(array[3]){
						resolve({module:"portfolio_detail",param:{id:array[2],item_id:array[3],title:module.title}});
					}
				}else if(array[0].indexOf("form") != -1){
					resolve({module:array[0],param:{title:module.title}});
				}else{
					resolve(0);
					let alert = this.alertCtrl.create({
						title: 'Attention',
						subTitle: 'Wrong URI!',
						buttons: [{
							text: 'Ok',
							handler: () => {
							
							}
						 }]
					});
					alert.present();
				}
			}
		});
	}

	data_generate(config:Config){
		return new Promise<any>((resolve,reject)=>{
			this._storage.getSetting().then(setting=>{
				if(setting.offline || config.offline){
					this._storage.getLocalData(config.table).then(callback=>{
						if(callback && config.filter){
							if(config.filter.parent_key){
								callback = _.filter(callback,function(o) { return _.get(o,''+config.filter.parent_key+'.'+config.filter.key+'') == config.filter.value; });
							}else{
								//console.log(config.filter);
								//console.log(callback);
								callback = _.filter(callback,function(o){return o[config.filter.key] == config.filter.value});
							}
							if(config.filter.object){
								callback = callback[0];
							}
						}
						resolve(callback);
					});
				}else{
					config.query.func.bind(this._query)(config.query.param).then(callback=>{
						//console.log(config.filter);
						//console.log("LIsttt",callback);
						resolve(callback);
					});
				}
			});
		});
	}
	  
	banner_home({load=true,offline=false}={}){
		return new Promise<any>((resolve,reject)=>{
			let option:Config;
			option = {
				table:table.banner_single,
				offline:offline,
				query:{
					func:this._query.banner_home,
					param:{load:load}
				},
				filter:{
					key:"slug",
					value:"mester-banner"
				}
			}
			this.data_generate(option).then(callback=>{
				resolve(callback);
			});
		});
	}

  	navigation({load=true,offline=false,slide=false,slide_limit=10}={}){
		return new Promise<any>((resolve,reject)=>{
			let option:Config;
			option = {
				table:table.navigation,
				offline:offline,
				query:{
					func:this._query.navigations,
					param:{load:load}
				}
			}
			this.data_generate(option).then(callback=>{
				if(slide){
					this.slideModuleInit(callback,slide_limit).then(module=>{
						resolve(module);
					});
				}else{
					resolve(callback);
				}
			});
  		});  
  	}

  	blog_categories({load=true,offline=false}={}){
		return new Promise<any>((resolve,reject)=>{
			let option:Config;
			option = {
				table:table.blog_category,
				offline:offline,
				query:{
					func:this._query.blog_categories,
					param:{load:load}
				}
			}
			this.data_generate(option).then(callback=>{
				resolve(callback);
			});
		});
	}
	  
  	blog_list({id,load=true,offline=false}){
		return new Promise<any>((resolve,reject)=>{
			let option:Config;
			option = {
				table:table.blog_list,
				offline:offline,
				query:{
					func:this._query.blog_list,
					param:{load:load,id:id}
				},
				filter:{
					key:"category",
					value:id
				}
			}
			this.data_generate(option).then(callback=>{
				resolve(callback);
			});
		});
	}
	blog_type({type,load=true,offline=false}){
		return new Promise<any>((resolve,reject)=>{
			let option:Config;
			option = {
				table:table.blog_list,
				offline:offline,
				query:{
					func:this._query.blog_type,
					param:{load:load,type:type}
				},
				filter:{
					key:type,
					value:"1"
				}
			}
			this.data_generate(option).then(callback=>{
				resolve(callback);
			});
		});
	}
  	blog_detail({id,load=true,offline=false}){
		return new Promise<any>((resolve,reject)=>{
			let option:Config;
			option = {
				table:table.blog_list,
				offline:offline,
				query:{
					func:this._query.blog_detail,
					param:{load:load,id:id}
				},
				filter:{
					key:"id",
					value:id,
					object:true
				}
			}
			this.data_generate(option).then(callback=>{
				resolve(callback);
			});
 		});
  	}


  	gallery_category({load=true,offline=false}={}){
		return new Promise<any>((resolve,reject)=>{
			let option:Config;
			option = {
				table:table.gallery_category,
				offline:offline,
				query:{
					func:this._query.gallery_category,
					param:{load:load}
				}
			}
			this.data_generate(option).then(callback=>{
				resolve(callback);
			});
		});
  	}
  	gallery_list({id,load=true,offline=false}){
		return new Promise<any>((resolve,reject)=>{
			let option:Config;
			option = {
				table:table.gallery_single,
				offline:offline,
				query:{
					func:this._query.gallery_list,
					param:{load:load,id:id}
				},
				filter:{
					key:"category",
					value:id
				}
			}
			this.data_generate(option).then(callback=>{
				resolve(callback);
			});
		});
  	}
  	gallery_detail({id,load=true,offline=false}){
		return new Promise<any>((resolve,reject)=>{
			let option:Config;
			option = {
				table:table.gallery_single,
				offline:offline,
				query:{
					func:this._query.gallery_detail,
					param:{load:load,id:id}
				},
				filter:{
					key:"id",
					value:id,
					object:true
				}
			}
			this.data_generate(option).then(callback=>{
				resolve(callback);
			});
  		});
  	}

  	portfolio_category({load=true,offline=false}={}){
		return new Promise<any>((resolve,reject)=>{
			let option:Config;
			option = {
				table:table.portfolio_category,
				offline:offline,
				query:{
					func:this._query.portfolio_categories,
					param:{load:load}
				}
			}
			this.data_generate(option).then(callback=>{
				resolve(callback);
			});
  		});
  	}
  	portfolio_list({id,load=true,offline=false}){
		return new Promise<any>((resolve,reject)=>{
			let option:Config;
			option = {
				table:table.portfolio_single,
				offline:offline,
				query:{
					func:this._query.portfolio_detail,
					param:{load:load,id:id}
				},
				filter:{
					key:"category",
					value:id
				}
			}
			this.data_generate(option).then(callback=>{
				resolve(callback);
			});
		});
  	}
	
  	page_detail({slug,load=true,offline=false}){
		return new Promise<any>((resolve,reject)=>{
		    let option:Config;
			option = {
				table:table.page_single,
				offline:offline,
				query:{
					func:this._query.page_detail,
					param:{load:load,slug:slug}
				},
				filter:{
					key:"slug",
					value:slug,
					object:true
				}
			}
			this.data_generate(option).then(callback=>{
				if(callback){
					callback = callback.body;
				}
				resolve(callback);
			});
		});
	}
	  
	product_detail({id,load=true,offline=false,withOption=false}){
		let funcWithOption = (product)=>{
			let array = [];
            let index = -1;
            product.modifiers = JSON.parse(product.modifiers);
            Object.keys(product.modifiers).forEach(function(key){
                index = index +1;
                array.push(Object.assign({},product.modifiers[key]));  
                Object.keys(product.modifiers[key].variations).forEach(function(k){
                  if(array[index].variations instanceof Array){
                  }else{
                     array[index].variations = [];
                  }
                  array[index].variations.push(product.modifiers[key].variations[k]);
                });
            });
			product.modifiers = array;
			return product;
		};
		return new Promise<any>((resolve,reject)=>{
			let option:Config;
			option = {
				table:table.product_single,
				offline:offline,
				query:{
					func:this._query.product_detail,
					param:{load:load,id:id}
				},
				filter:{
					key:"id",
					value:id,
					object:true
				}
			}
			this.data_generate(option).then(callback=>{
				if(withOption){
					callback = funcWithOption(callback);
				}
				resolve(callback);
			});
		});
	}
  	product_list({id,load=true,offline=false}){
		return new Promise<any>((resolve,reject)=>{
			let option:Config;
			option = {
				table:table.product_list,
				offline:offline,
				query:{
					func:this._query.product_list,
					param:{load:load,id:id}
				},
				filter:{
					parent_key:"category",
					key:"category_"+id,
					value:true
				}
			}
			this.data_generate(option).then(callback=>{
				resolve(callback);
			});
		});
	}

	product_listAll({load=true,offline=false}={}){
		return new Promise<any>((resolve,reject)=>{
			let option:Config;
			option = {
				table:table.product_list,
				offline:offline,
				query:{
					func:this._query.product_listAll,
					param:{load:load}
				}
			}
			this.data_generate(option).then(callback=>{
				resolve(callback);
			});
		});
  	}

	product_type({type,load=true,limit=0,offline=false}){
		return new Promise<any>((resolve,reject)=>{
			let option:Config;
			option = {
				table:table.product_list,
				offline:offline,
				query:{
					func:this._query.product_type,
					param:{load:load,type:type,limit:limit}
				},
				filter:{
					key:type,
					value:"1"
				}
			}
			this.data_generate(option).then(callback=>{
				resolve(callback);
			});
		});
	}
  	product_category_id({id,load=true,offline=false}){
		return new Promise<any>((resolve,reject)=>{
			let option:Config;
			option = {
				table:table.product_category,
				offline:offline,
				query:{
					func:this._query.product_category_filter_id,
					param:{load:load,id:id}
				},
				filter:{
					key:"id",
					value:id,
					object:true
				}
			}
			this.data_generate(option).then(callback=>{
				resolve(callback);
			});
  		});
	}
	product_category({load=true,offline=false}={}){
		return new Promise<any>((resolve,reject)=>{
			let option:Config;
			option = {
				table:table.product_category,
				offline:offline,
				query:{
					func:this._query.product_category,
					param:{load:load}
				}
			}
			this.data_generate(option).then(callback=>{
				resolve(callback);
			});
		});
	}
  	product_search({search,load=true,offline=false}){
		return new Promise<any>((resolve,reject)=>{
			let option:Config;
			option = {
				table:table.product_list,
				offline:offline,
				query:{
					func:this._query.product_listAll,
					param:{load:load}
				}
			}
			this.data_generate(option).then(callback=>{
				if(callback){
					let products = [];
					(callback as any).forEach(data=>{
						if(data.title.toLowerCase().indexOf(search.toLowerCase()) != -1){
							products.push(data);
						}
					});
					resolve(products);
				}else{
					resolve(callback);
				}
			});
  		});
  	}
  	product_filter({option,product,load=true,cate_id=""}){
  		return new Promise<any>((resolve,reject)=>{
  			this._storage.getSetting().then(setting=>{
  	   		   if(setting.offline || this._query.getDatabase() == dbFirebase){
  			   		this._query.product_filter_local({product:product,option:option}).then(product=>{
  	   					resolve(product);
  	   				});
  			   }else{
	  	   			this._query.product_filterPhp({load:load,cate_id:cate_id,option:option}).then(product=>{
	  	   				resolve(product);
	  	  			});
  	   		   }
  	   		});
  		});
	}

	listing_featured({load=true,offline=false,groupByCate=false}={}){
		return new Promise<any>((resolve,reject)=>{
			let option:Config;
			option = {
				table:table.listing_single,
				offline:offline,
				query:{
					func:this._query.listing_featured,
					param:{load:load}
				}
			}
			this.data_generate(option).then(callback=>{
				if(callback){
					callback = callback.filter(function(o,key){ return o.featured == "1"}) || false;
					if(groupByCate){
						callback = _.chain(callback).groupBy("category_title")
						.toPairs()
						.map(function(currentItem) {
								if(currentItem[0] != "undefined"){
									return _.zipObject(["title", "child"], currentItem);
								}
						})
						.compact()
						.value();
					}
				}
				resolve(callback);
			});
		});
	}
	listing_list({id,load=true,offline=false}){
		return new Promise<any>((resolve,reject)=>{
			let option:Config;
			option = {
				table:table.listing_single,
				offline:offline,
				query:{
					func:this._query.listing_list,
					param:{load:load,id:id}
				},
				filter:{
					key:"category",
					value:id
				}
			}
			this.data_generate(option).then(callback=>{
				resolve(callback);
			});
		});
	}
	listing_listAll({load=true,offline=false}={}){
		return new Promise<any>((resolve,reject)=>{
			let option:Config;
			option = {
				table:table.listing_single,
				offline:offline,
				query:{
					func:this._query.listing_listAll,
					param:{load:load}
				}
			}
			this.data_generate(option).then(callback=>{
				resolve(callback);
			});
		});
	}
	listing_category({load=true,offline=false}={}){
		return new Promise<any>((resolve,reject)=>{
			let option:Config;
			option = {
				table:table.listing_category,
				offline:offline,
				query:{
					func:this._query.listing_category,
					param:{load:load}
				}
			}
			this.data_generate(option).then(callback=>{
				resolve(callback);
			});
		});
	}
	  
	order_address({id,load=true,offline=false}){
		return new Promise<any>((resolve,reject)=>{
			let option:Config;
			option = {
				table:table.order_address,
				offline:offline,
				query:{
					func:this._query.order_address,
					param:{load:load,id:id}
				},
				filter:{
					key:"created_by",
					value:id
				}
			}
			this.data_generate(option).then(callback=>{
				resolve(callback);
			});
		});
	}

	order_gateway({load=true,offline=false}={}){
		return new Promise<any>((resolve,reject)=>{
			let option:Config;
			option = {
				table:table.order_gateway,
				offline:offline,
				query:{
					func:this._query.order_gateway,
					param:{load:load}
				}
			}
			this.data_generate(option).then(callback=>{
				resolve(callback);
			});
		});
	}

	order_single({load=true,offline=false}={}){
		return new Promise<any>((resolve,reject)=>{
			let option:Config;
			option = {
				table:table.order_single,
				offline:offline,
				query:{
					func:this._query.order_single,
					param:{load:load}
				}
			}
			this.data_generate(option).then(callback=>{
				resolve(callback);
			});
		});
	}

	users_single({load=true,offline=false}={}){
		return new Promise<any>((resolve,reject)=>{
			let option:Config;
			option = {
				table:table.users_single,
				offline:offline,
				query:{
					func:this._query.users_single,
					param:{load:load}
				}
			}
			this.data_generate(option).then(callback=>{
				resolve(callback);
			});
		});
	}

	form_config({type,load=true,offline=false}){
		return new Promise<any>((resolve,reject)=>{
			let option:Config;
			option = {
				table:table.form_config,
				offline:offline,
				query:{
					func:this._query.form_config,
					param:{load:load}
				}
			}
			this.data_generate(option).then(callback=>{
				resolve(callback[type]);
			});
		});
	}
}
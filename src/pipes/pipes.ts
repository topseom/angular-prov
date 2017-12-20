import { Injectable, Pipe, PipeTransform} from '@angular/core';
import { DomSanitizer, SafeHtml} from '@angular/platform-browser';
import * as _ from 'lodash';

@Pipe({
    name: 'column'
})
@Injectable()
export class Column implements PipeTransform {
    transform(column: any, item: any): any {
		let column_value = "";
		_.mapKeys(item, function(value, key) {
				 
				 if(key == column.title)
				 {
					if(!_.isNull(value))
					{
						column_value = value.toString();
					}
					
				 }
		});
		
		return column_value;
    }
}

@Pipe({
    name: 'recycle'
})
@Injectable()
export class Recycle implements PipeTransform {
    transform(items: any, status: any): any {
		
		if(status)
		{
			
			
			let array = [];
			
			items.forEach((data)=>{
				if(data.recycle == 1)
				{
					array.push(data);
				}
			});
			return array;
		}
		let array = [];
			
			items.forEach((data)=>{
				if(data.recycle == 0)
				{
					array.push(data);
				}
		 });
		return array;
    }
}

@Pipe({
   name: 'positive',
   pure: false
})
@Injectable()
export class Positive {
   transform(value){
   	  let num = parseFloat(value);
	  if(num < 0)
	  {
	  	 return num * -1;
	  }
	  return num;	 
   }
}

@Pipe({
   name: 'number',
   pure: false
})
@Injectable()
export class NumberPipe {
   transform(value){
   	  if(value % 1 === 0){
   	  	 value = parseInt(value);
   	  }
   	  else{
   	  	 value = parseFloat(value).toFixed(2);
   	  }
	  return String(value).replace(/(.)(?=(\d{3})+$)/g,'$1,');	 
   }
}

@Pipe({
    name: 'store'
})
@Injectable()
export class StoreFilter implements PipeTransform {
    transform(items: any[], store: any): any {
		if(store){
			let store_id = store.id;
			if(store.product_all.value != 'Yes')
			{
				let filter = [];
				items.forEach(data=>{
					 
					 if(data.store_array != 0 && data.store_array != undefined)
					 {
						data.store_array.forEach(data2=>{
							
							if(store_id == data2)
							{
								filter.push(data);
							}
						});
					 	
					 }
				});
				
				return filter;
			}
			 
			return items;
		}
		return items;
    }
}

@Pipe({
    name: 'title'
})
@Injectable()
export class TitleProduct implements PipeTransform {
    transform(name: any, limit: any): any {
    	if(name){
    		return name.substring(0,limit);
    	}else{
    		return name;
    	}
		
    }
}

@Pipe({
    name: 'upper_first_letter'
})
@Injectable()
export class FirstLetter implements PipeTransform {
    transform(title: any): any {
		if(!_.isUndefined(title)){
			return title.charAt(0).toUpperCase() + title.slice(1);
		}
		return title;
    }
}



@Pipe({
    name: 'filter_user'
})
@Injectable()
export class FilterUser implements PipeTransform {
    transform(items: any): any {
		if(!_.isUndefined(items))
		{
			let array = [];
			items.forEach((data)=>{
				if(data.group_name == "User")
				{
					array.push(data);
				}
			});
			return array;
		}
		
    }
}

@Pipe({
   name: 'site_ref',
   pure: false
})
@Injectable()
export class SiteRef {
   transform(title: any[]){
	  let cut_text = '';
	  for(var i=0;i<=title.length;i++)
	  {
	  	
	  	if(title[i] == '.')
		{
			break;
		}
		cut_text = cut_text+title[i];
	  }
	  return cut_text.replace(/(^\w+:|^)\/\//, '');	 
   }
}
@Pipe({
   name: 'default_created_by',
   pure: false
})
@Injectable()
export class DefaultOrderTitle {
    transform(title: any): any {
			if(title == null){
				title = "Guest";
			}
			return title;
    }
}
@Pipe({
	name:"objToArray"
	})
export class objToArray  implements PipeTransform {
	transform(obj : any): any {
	console.log("obg : "+obj);
	let option = [];
	Object.keys(obj.variations).forEach(function(key){
    	option.push(obj.variations[key]);	
	});
	return option;
  }
}

@Pipe({ name: 'sort_by' })
export class SortBy {
  transform(array, args){
  	if(args != null){
		if(args[0] != null && args[1] != null){
  			return _.orderBy(array, args[0],args[1]);
  		}
		else if(args[0] != null){
			return _.orderBy(array, args[0],'asc');
		}
	}
    return array;
  }
}

@Pipe({ name: 'lang_code' })
export class LangCode {
  constructor(){}

  transform(array, args='en') {
  	let filter = array;
  	if(args != null){
  		filter = _.filter(array, function(data) { return (data as any).lang_code == args});
  		return filter;
  	}
  	return filter;
  	
  }
}

@Pipe({ name: 'cutText' })
export class CutText {
  constructor(){}

  transform(array, args) {
  	let filter = array;

  	if(args != null){
  		let res = filter.substring(0, args);
  		res = res + '..';
  		return res;
  	}
  	return filter;
  	
  }
}

@Pipe({ name: 'orderby_distance' })
export class OrderbyDistance {
  constructor(){}

  transform(array){
  	if(array){
  		if(array[0].distance){
			return _.orderBy(array,'distance','asc');
		}
  	}
    return array;
  }
}

@Pipe({
  name: 'sanitizeHtml'
})
export class SanitizeHtmlPipe implements PipeTransform {

  constructor(private _sanitizer:DomSanitizer) {
  }

  transform(v:string):SafeHtml {
    return this._sanitizer.bypassSecurityTrustHtml(v);
  }
}

@Pipe({ name: 'json_parse' })
export class JsonParse {
  constructor(){}

  transform(text) {
  	text = JSON.parse(text);
  	return text;
  	
  }
}


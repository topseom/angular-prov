import { Directive,Input,ElementRef,Renderer2,Inject } from '@angular/core';
import ImgCache from 'imgcache.js';

@Directive({
  selector: '[image-cache-background]'
})

export class ImageCacheBackground{
	@Input('path') src ='';
	@Input('noImg') noImg = '';
	
	constructor(@Inject('config') private config:any,public el: ElementRef,public renderer: Renderer2) {}

  	ngOnInit() {
  		const nativeElement = this.el.nativeElement;
    	const render = this.renderer;
    	if(this.src){
    		this.storeCache(this.src).then((value)=>{
    			if(value){
    				render.setStyle(nativeElement, 'background-image', 'url("'+value+'")');
    			}else{
            render.setStyle(nativeElement, 'background-image', 'url("'+this.src+'")');
    			}
    		});
    	}else{
				this.noImg = this.noImg?this.noImg:this.config.noImg;
        render.setStyle(nativeElement, 'background-image', 'url("'+this.noImg+'")');
    	}	
  	}

  	storeCache(src: string): Promise<any>{
  		return new Promise((resolve, reject) => {
  		  if(ImgCache.ready){
  		  	ImgCache.isCached(src, (path: string, success: boolean) => {
		        if (success) {
		          ImgCache.getCachedFileURL(src,
		            (originalUrl, cacheUrl) => {
		              resolve(cacheUrl);
		            },
		            (e) => {
		              reject(e)
		            });
		        } else {
		          // cache img
		          ImgCache.cacheFile(src);
		          // return original img URL
		          resolve(src);
		        }
      		});
  		  }else{
  		  	resolve(0);
  		  }
	      
    	});
  	}

}
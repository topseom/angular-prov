import { Component } from '@angular/core';
import * as tsmoment from 'moment';
const moment = tsmoment;

@Component({
	selector:"widget-clock",
	template:"<h1 class='dateTime'>{{ clock }} <br/><span> {{ date }} </span></h1>"
})
export class WidgetClock{
	public clock:any;
  	public date:any;
	
	constructor(){
		this.time();
	}
	
	time(){
	  	this.date = moment().format("ddd, MMM DD")
	  	this.startClock();
 	}

    startClock(){
	  	let today = new Date();
	    let h = today.getHours();
	    let m = today.getMinutes();
	    m = this.checkTime(m);
	    this.clock = h + ":" + m;
	    setTimeout(() => {
	    	this.startClock();
	    }, 500);
    }
    checkTime(i){
  		if (i < 10) {i = "0" + i};
  		return i;
    }
}
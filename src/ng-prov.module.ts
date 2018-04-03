import { BrowserModule } from '@angular/platform-browser';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA,ModuleWithProviders  } from '@angular/core';

import { Column } from './pipes/pipes';
import { Recycle } from './pipes/pipes';
import { Positive } from './pipes/pipes';
import { NumberPipe } from './pipes/pipes';
import { StoreFilter } from './pipes/pipes';
import { TitleProduct } from './pipes/pipes'
import { FirstLetter } from './pipes/pipes';
import { FilterUser } from './pipes/pipes';
import { SiteRef } from './pipes/pipes';
import { DefaultOrderTitle } from './pipes/pipes';
import { objToArray } from './pipes/pipes';
import { SortBy } from './pipes/pipes';
import { LangCode } from './pipes/pipes';
import { CutText } from './pipes/pipes';
import { OrderbyDistance } from './pipes/pipes';
import { SanitizeHtmlPipe } from './pipes/pipes';
import { JsonParse } from './pipes/pipes';

export const APP_PIPES = [
	Column,
	Recycle,
	Positive,
	NumberPipe,
	StoreFilter,
	TitleProduct,
	FirstLetter,
	FilterUser,
	SiteRef,
	DefaultOrderTitle,
	objToArray,
	SortBy,
	LangCode,
	CutText,
	OrderbyDistance,
	SanitizeHtmlPipe,
	JsonParse
]

import { SiteStorage } from './providers/site-storage';
import { SiteService } from './providers/site-service';
import { AuthService } from './providers/auth-service';
import { StorageService } from './providers/storage-service';
import { QueryService } from './providers/query-service';
import { UpdateService } from './providers/update-service';
import { DeleteService } from './providers/delete-service';
import { InsertService } from './providers/insert-service';
import { DataService } from './providers/data-service';
import { StreamService } from './providers/stream-service';

import { Facebook } from '@ionic-native/facebook';
import { GooglePlus } from '@ionic-native/google-plus';

import { ImageCache } from './directive/image-cache';
import { ImageCacheBackground } from './directive/image-cache-background';

import { WidgetClock } from './widget/clock';
import { WidgetSite } from './widget/site';
import { WidgetSitelist } from './widget/siteList';
import { WidgetUserSetting } from './widget/userSetting';

export const WIDGET = [
    WidgetClock,
    WidgetSite,
    WidgetSitelist,
    WidgetUserSetting
]

import { Network } from '@ionic-native/network';

import { IonicStorageModule } from '@ionic/storage';
import { TranslateModule, TranslateLoader,TranslatePipe } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClientModule, HttpClient } from '@angular/common/http';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

import { NgxPaginationModule } from 'ngx-pagination';


import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AngularFirestoreModule } from 'angularfire2/firestore';
import { AngularFireAuthModule } from 'angularfire2/auth';


import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';


@NgModule({
    declarations:[
        APP_PIPES,
        WIDGET,
        ImageCache,
        ImageCacheBackground
    ],
    exports:[
        APP_PIPES,
        WIDGET,
        ImageCache,
        ImageCacheBackground,
        TranslateModule,
        NgxPaginationModule
    ],
    entryComponents:[
        WIDGET
    ],
    imports: [
        BrowserModule,
        HttpClientModule,
        NgxPaginationModule,
        TranslateModule.forRoot({
            loader: {
              provide: TranslateLoader,
              useFactory: (createTranslateLoader),
              deps: [HttpClient]
            }
        }),
        AngularFireModule.initializeApp({
            apiKey: "AIzaSyCYIxQwZTTbTjbY2Nmzom0DS_gLec3K6rs",
            authDomain: "main-f50e4.firebaseapp.com",
            databaseURL: "https://main-f50e4.firebaseio.com",
            projectId: "main-f50e4",
            storageBucket: "main-f50e4.appspot.com",
            messagingSenderId: "229358120035"
        }),
        AngularFireDatabaseModule,
        AngularFireAuthModule,
        AngularFirestoreModule.enablePersistence(),
        IonicStorageModule.forRoot()
    ],
    schemas:[CUSTOM_ELEMENTS_SCHEMA]
})
export class NgProvModule{
    static forRoot(config:Config): ModuleWithProviders {
        return {
          ngModule: NgProvModule,
          providers: [
              {provide: 'config', useValue: config},
              SiteStorage,
              SiteService,
              AuthService,
              StorageService,
              QueryService,
              UpdateService,
              DeleteService,
              InsertService,
              DataService,
              StreamService,
              Network,
              SplashScreen,
              StatusBar,
              Facebook,
              GooglePlus
            ]
        };
    }
}
export interface Config{
    app:string,
    database?:string,
    platform?:string,
    theme?:string,
    noImg?:string,
    demo?:boolean,
    offline?:boolean
}  

import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { SiteService } from './site-service';
// import { AuthService } from './auth-service';
// import { StorageService } from './storage-service';
// import { QueryService } from './query-service';
// import { UpdateService } from './update-service';
// import { DeleteService } from './delete-service';
// import { InsertService } from './insert-service';
// import { DataService } from './data-service';

import { Network } from '@ionic-native/network';

// import { AngularFireModule } from 'angularfire2';
// import { AngularFireDatabaseModule } from 'angularfire2/database';
// import { AngularFireAuthModule } from 'angularfire2/auth';


// export const firebaseConfig = {
//     apiKey: "AIzaSyCYIxQwZTTbTjbY2Nmzom0DS_gLec3K6rs",
//     authDomain: "main-f50e4.firebaseapp.com",
//     databaseURL: "https://main-f50e4.firebaseio.com",
//     projectId: "main-f50e4",
//     storageBucket: "main-f50e4.appspot.com",
//     messagingSenderId: "229358120035"
// };

@NgModule({
    imports: [
        BrowserModule
        // ,
        // AngularFireModule.initializeApp(firebaseConfig),
        // AngularFireDatabaseModule,
        // AngularFireAuthModule,
    ],
    providers:[
        SiteService,
        // AuthService,
        // StorageService,
        // QueryService,
        // UpdateService,
        // DeleteService,
        // InsertService,
        // DataService,
        Network
    ]
})

export class NgProvModule{}

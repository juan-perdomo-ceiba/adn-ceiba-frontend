import { BrowserModule } from '@angular/platform-browser';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HomeComponent } from '@home/home.component';
import { ProductoModule } from '@producto/producto.module';
import { CoreModule } from '@core/core.module';
import { CookieService } from 'ngx-cookie-service';
import { LugarTuristicoModule } from '@lugar-turistico/lugar-turistico.module';
import { MunicipioModule } from '@municipio/municipio.module';
import { PaqueteTuristicoModule } from '@paquete-turistico/paquete-turistico.module';
import { ReservaModule } from '@reserva/reserva.module';




@NgModule({
  declarations: [
    AppComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ProductoModule,
    LugarTuristicoModule,
    MunicipioModule,
    PaqueteTuristicoModule,
    ReservaModule,
    CoreModule
  ],
  providers: [CookieService],
    bootstrap: [AppComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }

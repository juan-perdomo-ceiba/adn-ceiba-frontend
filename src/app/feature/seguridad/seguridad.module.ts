import { NgModule } from '@angular/core';

import { SharedModule } from '@shared/shared.module';
import { LoginComponent } from './components/login/login.component';
import { SeguridadRoutingModule } from './seguridad-routing.module';
import { SeguridadService } from './shared/service/seguridad.service';


@NgModule({
  declarations: [
    LoginComponent
  ],
  imports: [
    SeguridadRoutingModule,
    SharedModule
  ],
  providers: [SeguridadService]
})
export class SeguridadModule { }

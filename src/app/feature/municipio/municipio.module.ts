import { NgModule } from '@angular/core';

import { SharedModule } from '@shared/shared.module';
import { MunicipioService } from './shared/service/municipio.service';


@NgModule({
  declarations: [

  ],
  imports: [
    SharedModule
  ],
  providers: [MunicipioService]
})
export class MunicipioModule { }

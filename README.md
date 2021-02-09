### app-angular-base

**Recordar adjuntar uno de los bloques con estilo para complementar este bloque.**

Este bloque contiene la estructura necesaria para construir un proyecto en angular siguiendo la guia de estilos de angular.

[https://angular.io/guide/styleguide#style-guide](https://angular.io/guide/styleguide#style-guide)

Las características principales son
- Soporte de enrutamiento
- Manejo de seguridad
- Soporte lazy loading
- Arquitectura core-shared-feature
- Directiva para mostrar errores de formularios
- Pipe para uso de TrackBy dentro de los ngFor
- Pruebas unitarias y e2e
- Manejo centralizado de errores

#### Estructura del proyecto

Los archivos de la aplicación se encuentran en la subcarpeta src. Las pruebas iniciales correspondientes de extremo a extremo se encuentran en la subcarpeta e2e.

El proyecto base está estructurado en los módulos feature, shared y core. Asegurando una separación adecuada de las preocupaciones, lo que facilitará la escalabilidad a medida que su aplicación crezca. Lo siguiente describe brevemente cada tipo de módulo.

##### Módulo core
Deben estar lo transversal y de una sola instancia en la aplicación. Por ejemplo: NavBar o interceptor.

##### Módulo feature
Deben estar los componentes que implementan funcionalidades especificas de la aplicación. Por ejemplo, el componente datos de contacto el cual es el componente que implementa la feature de contacto. Es posible tener compartidos dentro de esta feature.

##### Módulo shared
Deben estar componentes o utilidades comunes a las diferentes feature. Por ejemplo, un componente de un botón azul que usted desea repetir en varios lugares. Un filtro para ser utilizado en todos los componentes.


Después de importar el proyecto se muestra de la siguiente manera


![enter image description here](https://drive.google.com/uc?export=download&id=1Kp5uXDxH42HE-1y1qkgx5nzUeeYnCq7A)



## Angular base .css

### Estilos visuales del proyecto

Los estilos que irán dentro de angular-base.css serán agregados en el style normalmente.

Ejemplo:

![añadir estilos css](https://drive.google.com/uc?export=download&id=1v212sYQ0DNnIfxwZq7mMsEhdRoHTeCwZ)

### Librerias externas

La carpeta vendor es donde tendremos estas extensiones que son descargadas de librerías externas.

```bash
assets / css / vendor
```
Ejemplo:

![añadir librerias visuales externas](https://drive.google.com/uc?export=download&id=1-IkUTU_jaazJKbj6PiF4UCgWwkMu5KKX)

### Aplicación de estilos por componentes

Tener en cuenta agregar los estilos por cada componente, es decir, cada vista debe contar con su propia hoja de estilos, esto aplica para aplicar estilos atributos que afectan sólo ese componente.

![añadir librerias visuales externas](https://drive.google.com/uc?export=download&id=1Dh8SuyvluRxRkov3zYSbBwjn-u2yzAGH)
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filtroEquipo',
  standalone: true
})
export class FiltroEquipoPipe implements PipeTransform {

  transform(equipos: any[], texto: string): any[] {
    if (!equipos) return [];
    if (!texto || texto.trim() === '') return equipos;

    const filtro = texto.toLowerCase().trim();

    return equipos.filter(eq =>
      eq.nombre?.toLowerCase().includes(filtro)
    );
  }

}

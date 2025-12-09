import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-export-buttons',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './export-buttons.component.html',
  styleUrls: ['./export-buttons.component.css']
})
export class ExportButtonsComponent {

  @Input() onExportPDF!: () => void;   
  @Input() onExportExcel!: () => void;

}

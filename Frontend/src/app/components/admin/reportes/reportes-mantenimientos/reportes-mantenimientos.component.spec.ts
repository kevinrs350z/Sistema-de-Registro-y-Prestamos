import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportesMantenimientosComponent } from './reportes-mantenimientos.component';

describe('ReportesMantenimientosComponent', () => {
  let component: ReportesMantenimientosComponent;
  let fixture: ComponentFixture<ReportesMantenimientosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportesMantenimientosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportesMantenimientosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportesAsignaturasComponent } from './reportes-asignaturas.component';

describe('ReportesAsignaturasComponent', () => {
  let component: ReportesAsignaturasComponent;
  let fixture: ComponentFixture<ReportesAsignaturasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportesAsignaturasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportesAsignaturasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

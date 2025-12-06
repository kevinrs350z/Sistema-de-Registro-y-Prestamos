import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportesEquiposComponent } from './reportes-equipos.component';

describe('ReportesEquiposComponent', () => {
  let component: ReportesEquiposComponent;
  let fixture: ComponentFixture<ReportesEquiposComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportesEquiposComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportesEquiposComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

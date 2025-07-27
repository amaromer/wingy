import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { Cheque } from '../../../core/models/cheque.model';
import { ChequeService } from '../../../core/services/cheque.service';

@Component({
  selector: 'app-cheque-view',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './cheque-view.component.html',
  styleUrls: ['./cheque-view.component.scss']
})
export class ChequeViewComponent implements OnInit {
  cheque: Cheque | null = null;
  loading = false;
  error = '';
  chequeId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private chequeService: ChequeService
  ) {}

  ngOnInit(): void {
    this.chequeId = this.route.snapshot.paramMap.get('id') || '';
    if (this.chequeId) {
      this.loadCheque();
    }
  }

  async loadCheque(): Promise<void> {
    this.loading = true;
    this.error = '';

    try {
      const cheque = await this.chequeService.getCheque(this.chequeId).toPromise();
      this.cheque = cheque || null;
    } catch (error) {
      console.error('Error loading cheque:', error);
      this.error = 'CHEQUE.ERROR.LOADING_CHEQUE';
    } finally {
      this.loading = false;
    }
  }

  onEdit(): void {
    this.router.navigate(['/cheques', this.chequeId, 'edit']);
  }

  onBack(): void {
    this.router.navigate(['/cheques']);
  }

  onPrint(): void {
    if (!this.cheque) {
      console.error('No cheque data available for printing');
      return;
    }

    // Create print window with cheque template
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      console.error('Failed to open print window');
      return;
    }

    const printContent = this.generateChequePrintTemplate();
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  }

  private generateChequePrintTemplate(): string {
    if (!this.cheque) return '';

    const cheque = this.cheque;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cheque - ${cheque.cheque_number}</title>
        <style>
          @media print {
            body { 
              margin: 0; 
              padding: 0; 
              background: transparent;
            }
            .cheque-fields { 
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
            }
            .no-print { display: none; }
            .field { 
              position: absolute;
              font-family: 'Courier New', monospace;
              font-weight: bold;
              color: #000;
              background: transparent;
              border: none;
              outline: none;
            }
          }
          
          body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 0;
            background: white;
            position: relative;
            width: 100%;
            height: 100vh;
          }
          
          .cheque-fields {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
          }
          
          .field {
            position: absolute;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            font-size: 14px;
            color: #000;
            background: transparent;
            border: none;
            outline: none;
            text-align: left;
            white-space: nowrap;
            overflow: hidden;
          }
          
          .date-field {
            top: 120px;
            left: 450px;
            font-size: 12px;
          }
          
          .payee-field {
            top: 180px;
            left: 80px;
            font-size: 16px;
            max-width: 400px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .amount-words-field {
            top: 220px;
            left: 80px;
            font-size: 12px;
            max-width: 500px;
            line-height: 1.3;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          
          .amount-field {
            top: 260px;
            left: 450px;
            font-size: 16px;
            text-align: right;
            min-width: 150px;
          }
          
          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            z-index: 1000;
          }
          
          .print-button:hover {
            background: #0056b3;
          }
          
          .instructions {
            position: fixed;
            top: 20px;
            left: 20px;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            border: 1px solid #ddd;
            max-width: 300px;
            font-size: 12px;
            z-index: 1000;
          }
          
          .instructions h4 {
            margin: 0 0 10px 0;
            color: #333;
          }
          
          .instructions ul {
            margin: 0;
            padding-left: 20px;
          }
          
          .instructions li {
            margin-bottom: 5px;
          }
        </style>
      </head>
      <body>
        <div class="instructions no-print">
          <h4>Printing Instructions:</h4>
          <ul>
            <li>Place pre-printed cheque in printer</li>
            <li>Ensure proper alignment</li>
            <li>Print only the filled fields</li>
            <li>Fields will be positioned automatically</li>
          </ul>
        </div>
        
        <button class="print-button no-print" onclick="window.print()">Print Cheque</button>
        
        <div class="cheque-fields">
          <!-- Date Field -->
          <div class="field date-field">${this.formatDate(cheque.cheque_date)}</div>
          
          <!-- Payee Name Field -->
          <div class="field payee-field">${cheque.payee_name}</div>
          
          <!-- Amount Field -->
          <div class="field amount-field">${this.formatCurrency(cheque.amount, cheque.currency)}</div>
          
          <!-- Amount in Words Field -->
          <div class="field amount-words-field">${cheque.amount_in_words}</div>
        </div>
      </body>
      </html>
    `;
  }

  getStatusClass(status: string): string {
    return this.chequeService.getStatusClass(status);
  }

  getStatusIcon(status: string): string {
    return this.chequeService.getStatusIcon(status);
  }

  formatCurrency(amount: number, currency: string): string {
    return this.chequeService.formatCurrency(amount, currency);
  }

  formatDate(date: string): string {
    return this.chequeService.formatDate(date);
  }
} 
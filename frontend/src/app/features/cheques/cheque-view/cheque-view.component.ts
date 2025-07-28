import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { Cheque, Project, Supplier } from '../../../core/models/cheque.model';
import { ChequeService } from '../../../core/services/cheque.service';
import { DEFAULT_CHEQUE_CONFIG, ChequePrintConfig } from '../../../core/config/cheque-print.config';

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

    // Create print preview window with cheque template
    const printWindow = window.open('', '_blank', 'width=1000,height=800,scrollbars=yes,resizable=yes');
    if (!printWindow) {
      console.error('Failed to open print window');
      return;
    }

    const printContent = this.generateChequePrintTemplate();
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Focus the window and wait for content to load
    printWindow.focus();
    printWindow.onload = () => {
      console.log('Print template loaded successfully');
    };
  }

  private generateChequePrintTemplate(): string {
    if (!this.cheque) return '';

    const cheque = this.cheque;
    const config = DEFAULT_CHEQUE_CONFIG;
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Cheque - ${cheque.cheque_number}</title>
        <style>
          @media print {
            * {
              margin: 0 !important;
              padding: 0 !important;
              box-sizing: border-box !important;
            }
            
            html, body { 
              margin: 0 !important; 
              padding: 0 !important; 
              background: white !important;
              width: 100% !important;
              height: 100% !important;
              overflow: hidden !important;
              font-family: 'Courier New', monospace !important;
              display: flex !important;
              justify-content: flex-end !important;
              align-items: center !important;
            }
            
            .cheque-container { 
              width: 216mm !important;
              height: 110mm !important;
              margin: 0 !important;
              position: relative !important;
              background: transparent !important;
              border: none !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-after: avoid !important;
              page-break-before: avoid !important;
            }
            
            .cheque-background {
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              height: 100% !important;
              background-image: url('${window.location.origin}${config.background.imageUrl}') !important;
              background-size: cover !important;
              background-position: center !important;
              background-repeat: no-repeat !important;
              background-color: #f0f0f0 !important;
              opacity: 1 !important;
            }
            
            .cheque-fields { 
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              height: 100% !important;
              z-index: 10 !important;
            }
            
            .no-print { display: none !important; }
            
            .field { 
              position: absolute !important;
              font-family: 'Courier New', monospace !important;
              font-weight: bold !important;
              color: #000 !important;
              background: transparent !important;
              border: none !important;
              outline: none !important;
              z-index: 15 !important;
            }
            
            .date-field {
              top: ${config.fields.date.top} !important;
              left: ${config.fields.date.left} !important;
              width: ${config.fields.date.width || 'auto'} !important;
              font-size: ${config.fields.date.fontSize} !important;
              font-weight: bolder !important;
              text-align: ${config.fields.date.textAlign || 'left'} !important;
            }
            
            .payee-field {
              top: ${config.fields.payee.top} !important;
              left: ${config.fields.payee.left} !important;
              max-width: ${config.fields.payee.maxWidth || 'none'} !important;
              font-size: ${config.fields.payee.fontSize} !important;
              text-align: ${config.fields.payee.textAlign || 'left'} !important;
              white-space: nowrap !important;
              overflow: hidden !important;
              text-overflow: ellipsis !important;
            }
            
            .amount-field {
              top: ${config.fields.amount.top} !important;
              left: ${config.fields.amount.left} !important;
              width: ${config.fields.amount.width || 'auto'} !important;
              font-size: ${config.fields.amount.fontSize} !important;
              text-align: ${config.fields.amount.textAlign || 'left'} !important;
              font-weight: bold !important;
            }
            
            .amount-words-field {
              top: ${config.fields.amountWords.top} !important;
              left: ${config.fields.amountWords.left} !important;
              max-width: ${config.fields.amountWords.maxWidth || 'none'} !important;
              height: ${config.fields.amountWords.height || 'auto'} !important;
              font-size: ${config.fields.amountWords.fontSize} !important;
              line-height: ${config.fields.amountWords.lineHeight || '1.2'} !important;
              text-align: ${config.fields.amountWords.textAlign || 'left'} !important;
              white-space: pre-wrap !important;
              word-wrap: break-word !important;
              overflow: hidden !important;
            }
            
            @page {
              size: 216mm 110mm !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            @page :first {
              margin: 0 !important;
            }
            
            @page :left {
              margin: 0 !important;
            }
            
            @page :right {
              margin: 0 !important;
            }
          }
          
          body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 0;
            background: white;
            width: 100%;
            height: 100vh;
            display: flex;
            justify-content: flex-end;
            align-items: center;
            min-height: 100vh;
          }
          
          .cheque-container {
            width: 216mm;
            height: 110mm;
            position: relative;
            background: transparent;
            border: 1px solid #ccc;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            margin: 0;
            max-width: 100%;
            max-height: 100vh;
          }
          
          .cheque-background {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: url('${window.location.origin}${config.background.imageUrl}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            background-color: #f0f0f0;
            opacity: 1;
            border: 1px solid #ccc;
          }
          
          .cheque-fields {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10;
          }
          
          .field {
            position: absolute;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            color: #000;
            background: transparent;
            border: none;
            outline: none;
            text-align: left;
            white-space: nowrap;
            overflow: hidden;
            z-index: 15;
          }
          
          /* Cheque field positions based on configuration */
          .date-field {
            top: ${config.fields.date.top};
            left: ${config.fields.date.left};
            width: ${config.fields.date.width || 'auto'};
            font-size: ${config.fields.date.fontSize};
            font-weight: bolder;
            text-align: ${config.fields.date.textAlign || 'left'};
          }
          
          .payee-field {
            top: ${config.fields.payee.top};
            left: ${config.fields.payee.left};
            max-width: ${config.fields.payee.maxWidth || 'none'};
            font-size: ${config.fields.payee.fontSize};
            text-align: ${config.fields.payee.textAlign || 'left'};
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .amount-words-field {
            top: ${config.fields.amountWords.top};
            left: ${config.fields.amountWords.left};
            max-width: ${config.fields.amountWords.maxWidth || 'none'};
            height: ${config.fields.amountWords.height || 'auto'};
            font-size: ${config.fields.amountWords.fontSize};
            line-height: ${config.fields.amountWords.lineHeight || '1.2'};
            text-align: ${config.fields.amountWords.textAlign || 'left'};
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow: hidden;
          }
          
          .amount-field {
            top: ${config.fields.amount.top};
            left: ${config.fields.amount.left};
            width: ${config.fields.amount.width || 'auto'};
            font-size: ${config.fields.amount.fontSize};
            text-align: ${config.fields.amount.textAlign || 'left'};
            font-weight: bold;
          }
          
          .print-button, .preview-button {
            position: fixed;
            top: 20px;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            z-index: 1000;
            margin-right: 10px;
          }
          
          .print-button {
            right: 140px;
            background: #007bff;
            color: white;
          }
          
          .preview-button {
            right: 20px;
            background: #6c757d;
            color: white;
          }
          
          .print-button:hover {
            background: #0056b3;
          }
          
          .preview-button:hover {
            background: #545b62;
          }
        </style>
      </head>
      <body>

        
        <button class="print-button no-print" onclick="window.print()">Print Cheque</button>
        <button class="preview-button no-print" onclick="window.close()">Close Preview</button>
        
        <div class="cheque-container">
          <div class="cheque-background" style="background-image: url('${window.location.origin}${config.background.imageUrl}'); background-color: #f0f0f0;" onerror="console.log('Background image failed to load: ${window.location.origin}${config.background.imageUrl}');"></div>
          <div class="cheque-fields">
            <!-- Date Field -->
            <div class="field date-field">${this.formatDate(cheque.cheque_date)}</div>
            
            <!-- Payee Name Field -->
            <div class="field payee-field">${cheque.payee_name}</div>
            
            <!-- Amount Field -->
            <div class="field amount-field">${this.formatAmountForPrint(cheque.amount)}</div>
            
            <!-- Amount in Words Field -->
            <div class="field amount-words-field">${cheque.amount_in_words}</div>
          </div>
          
          <!-- Print guide (only visible in preview) -->
          <div class="print-guide no-print" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 2px dashed #ff0000; pointer-events: none; z-index: 20;">
            <div style="position: absolute; top: 5px; left: 5px; background: rgba(255,0,0,0.8); color: white; padding: 2px 5px; font-size: 10px; font-family: Arial;">
              Cheque Background: 216mm × 110mm
            </div>
            <div style="position: absolute; bottom: 5px; left: 5px; background: rgba(0,255,0,0.8); color: white; padding: 2px 5px; font-size: 10px; font-family: Arial;">
              Check field positioning against background
            </div>
          </div>
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

  formatAmountForPrint(amount: number): string {
    // Format amount without currency symbol for print template
    return amount.toFixed(2);
  }

  formatDate(date: string): string {
    return this.chequeService.formatDate(date);
  }

  getProjectName(projectId: string | Project): string {
    if (typeof projectId === 'string') {
      return projectId;
    }
    return projectId?.name || 'N/A';
  }

  getSupplierName(supplierId: string | Supplier): string {
    if (typeof supplierId === 'string') {
      return supplierId;
    }
    return supplierId?.name || 'N/A';
  }
} 
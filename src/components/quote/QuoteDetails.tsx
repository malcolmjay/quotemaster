import React from 'react';
import { FileText, ChevronDown, Calendar, AlertTriangle } from 'lucide-react';
import { HelpTooltip } from '../common/HelpTooltip';

interface QuoteDetailsProps {
  quoteStatus?: string;
  onStatusChange?: (status: string) => void;
  onSupplyPeriodChange?: (months: number) => void;
  carryingCostPercent?: number;
  freightOverheadPercent?: number;
  onOverheadUpdate?: (carrying: number, freight: number) => void;
}

export const QuoteDetails: React.FC<QuoteDetailsProps> = ({
  quoteStatus = 'draft',
  onStatusChange,
  onSupplyPeriodChange,
  carryingCostPercent = 0,
  freightOverheadPercent = 0,
  onOverheadUpdate
}) => {
  const [showLossData, setShowLossData] = React.useState(quoteStatus === 'lost');
  const [quoteType, setQuoteType] = React.useState('Daily Quote');
  const [supplyPeriod, setSupplyPeriod] = React.useState('');
  const [dbeRequired, setDbeRequired] = React.useState('N');
  const [bidBondRequired, setBidBondRequired] = React.useState('N');
  const [performanceBondRequired, setPerformanceBondRequired] = React.useState('N');
  const [insuranceRequired, setInsuranceRequired] = React.useState('N');

  const [customerDeliveryReq, setCustomerDeliveryReq] = React.useState('N');
  const [stockRequirement, setStockRequirement] = React.useState('N');
  const [inventoryImpact, setInventoryImpact] = React.useState('N');
  const [packagingLabelling, setPackagingLabelling] = React.useState('N');
  const [specialRequirements, setSpecialRequirements] = React.useState('N');
  const [liquidatedDamages, setLiquidatedDamages] = React.useState('N');
  const [buyAmericaReq, setBuyAmericaReq] = React.useState('N');
  const [eeoApp, setEeoApp] = React.useState('N');
  const [allOrNothingBid, setAllOrNothingBid] = React.useState('N');
  const [oneTimeBuy, setOneTimeBuy] = React.useState('N');
  const [contractDetails, setContractDetails] = React.useState('N');
  const [amendments, setAmendments] = React.useState('N');
  const [alternatesAllowed, setAlternatesAllowed] = React.useState('N');
  const [oemBrandSpecific, setOemBrandSpecific] = React.useState('N');
  const [kinetik, setKinetik] = React.useState('N');
  const [priceNegotiable, setPriceNegotiable] = React.useState('N');

  const [questionPeriod, setQuestionPeriod] = React.useState('');
  const [acceptancePeriod, setAcceptancePeriod] = React.useState('');
  const [estimatedAwardDate, setEstimatedAwardDate] = React.useState('');

  React.useEffect(() => {
    setShowLossData(quoteStatus === 'lost');
  }, [quoteStatus]);

  const handleSupplyPeriodChange = (value: string) => {
    setSupplyPeriod(value);
    const months = parseInt(value) || 0;
    if (onSupplyPeriodChange) {
      onSupplyPeriodChange(months);
    }
  };

  const selectClasses = "appearance-none w-full px-3 py-2 border border-[#dce0e6] rounded-md text-sm bg-white text-[#1a1f36] focus:ring-2 focus:ring-[#1a6fb5] focus:border-[#1a6fb5] transition-all";
  const inputClasses = "w-full px-3 py-2 border border-[#dce0e6] rounded-md text-sm bg-white text-[#1a1f36] focus:ring-2 focus:ring-[#1a6fb5] focus:border-[#1a6fb5] transition-all";
  const labelClasses = "block text-xs font-medium text-[#5f6672] mb-1.5";

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-[#5f6672]">
        <FileText className="h-4 w-4" />
        <span className="text-xs font-semibold uppercase tracking-wide">Request for Quote Details</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div>
          <label className={labelClasses}>
            Quote Type <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <HelpTooltip content="Select the quote type. Choose 'Daily Quote' for standard quotes or 'Bid' for formal bids with special requirements.">
              <select
                value={quoteType}
                onChange={(e) => setQuoteType(e.target.value)}
                className={selectClasses}
              >
                <option>Daily Quote</option>
                <option>Bid</option>
              </select>
            </HelpTooltip>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8c939d] pointer-events-none" />
          </div>
        </div>

        <div>
          <label className={labelClasses}>Customer Bid Number</label>
          <input
            type="text"
            placeholder="Bid reference..."
            className={inputClasses}
          />
        </div>

        <div>
          <label className={labelClasses}>Purchase Order Number</label>
          <input
            type="text"
            placeholder="PO reference..."
            className={inputClasses}
          />
        </div>

        <div>
          <label className={labelClasses}>
            Valid Until <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            defaultValue="2025-09-13"
            className={inputClasses}
          />
        </div>

        <div>
          <label className={labelClasses}>Supply Period (months)</label>
          <HelpTooltip content="Enter the contract duration in months. For multi-year contracts (over 12 months), additional pricing columns will be enabled.">
            <input
              type="number"
              placeholder="e.g., 36"
              value={supplyPeriod}
              onChange={(e) => handleSupplyPeriodChange(e.target.value)}
              className={inputClasses}
              min="1"
              max="60"
            />
          </HelpTooltip>
          {parseInt(supplyPeriod) > 12 && (
            <div className="text-xs text-[#1a6fb5] mt-1 font-medium">
              Multi-year: {Math.ceil(parseInt(supplyPeriod) / 12)} years
            </div>
          )}
        </div>

        <div>
          <label className={labelClasses}>Ship Until</label>
          <input
            type="date"
            defaultValue="2025-11-13"
            className={inputClasses}
          />
        </div>

        <div>
          <label className={labelClasses}>Carrying Cost (%)</label>
          <HelpTooltip content="The carrying cost percentage applied to line item costs. This is used in margin calculations across all line items.">
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={carryingCostPercent}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                if (onOverheadUpdate) {
                  onOverheadUpdate(value, freightOverheadPercent);
                }
              }}
              className={inputClasses}
              placeholder="e.g., 1.87"
            />
          </HelpTooltip>
        </div>

        <div>
          <label className={labelClasses}>Freight Overhead (%)</label>
          <HelpTooltip content="The freight overhead percentage applied to line item costs. This is used in margin calculations across all line items.">
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={freightOverheadPercent}
              onChange={(e) => {
                const value = parseFloat(e.target.value) || 0;
                if (onOverheadUpdate) {
                  onOverheadUpdate(carryingCostPercent, value);
                }
              }}
              className={inputClasses}
              placeholder="e.g., 6.00"
            />
          </HelpTooltip>
        </div>
      </div>

      {quoteType === 'Bid' && (
        <div className="bg-[#f0f6ff] border border-[#c4d9f2] rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="h-4 w-4 text-[#1a6fb5]" />
            <span className="text-xs font-semibold text-[#1a6fb5] uppercase tracking-wide">Bid Requirements</span>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'DBE Requirement?', value: dbeRequired, onChange: setDbeRequired },
                { label: 'Bid Bond Required?', value: bidBondRequired, onChange: setBidBondRequired },
                { label: 'Performance Bond?', value: performanceBondRequired, onChange: setPerformanceBondRequired },
                { label: 'Insurance Required?', value: insuranceRequired, onChange: setInsuranceRequired },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-xs font-medium text-[#3d6b9e] mb-1.5">{field.label}</label>
                  <div className="relative">
                    <select
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="appearance-none w-full px-3 py-2 border border-[#c4d9f2] rounded-md text-sm bg-white text-[#1a1f36] focus:ring-2 focus:ring-[#1a6fb5]"
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8c939d] pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Customer Delivery Req?', value: customerDeliveryReq, onChange: setCustomerDeliveryReq },
                { label: 'Stock Requirement?', value: stockRequirement, onChange: setStockRequirement },
                { label: 'Inventory Impact?', value: inventoryImpact, onChange: setInventoryImpact },
                { label: 'Packaging & Labelling?', value: packagingLabelling, onChange: setPackagingLabelling },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-xs font-medium text-[#3d6b9e] mb-1.5">{field.label}</label>
                  <div className="relative">
                    <select
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="appearance-none w-full px-3 py-2 border border-[#c4d9f2] rounded-md text-sm bg-white text-[#1a1f36] focus:ring-2 focus:ring-[#1a6fb5]"
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8c939d] pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Special Requirements?', value: specialRequirements, onChange: setSpecialRequirements },
                { label: 'Liquidated Damages?', value: liquidatedDamages, onChange: setLiquidatedDamages },
                { label: 'Buy America (>$150K)?', value: buyAmericaReq, onChange: setBuyAmericaReq },
                { label: 'EEO/APP?', value: eeoApp, onChange: setEeoApp },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-xs font-medium text-[#3d6b9e] mb-1.5">{field.label}</label>
                  <div className="relative">
                    <select
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="appearance-none w-full px-3 py-2 border border-[#c4d9f2] rounded-md text-sm bg-white text-[#1a1f36] focus:ring-2 focus:ring-[#1a6fb5]"
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8c939d] pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'All or Nothing Bid?', value: allOrNothingBid, onChange: setAllOrNothingBid },
                { label: 'One Time Buy?', value: oneTimeBuy, onChange: setOneTimeBuy },
                { label: 'Contract Details?', value: contractDetails, onChange: setContractDetails },
                { label: 'Amendments?', value: amendments, onChange: setAmendments },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-xs font-medium text-[#3d6b9e] mb-1.5">{field.label}</label>
                  <div className="relative">
                    <select
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="appearance-none w-full px-3 py-2 border border-[#c4d9f2] rounded-md text-sm bg-white text-[#1a1f36] focus:ring-2 focus:ring-[#1a6fb5]"
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8c939d] pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Alternates Allowed?', value: alternatesAllowed, onChange: setAlternatesAllowed },
                { label: 'OEM Brand Specific?', value: oemBrandSpecific, onChange: setOemBrandSpecific },
                { label: 'Kinetik?', value: kinetik, onChange: setKinetik },
                { label: 'Price Negotiable?', value: priceNegotiable, onChange: setPriceNegotiable },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-xs font-medium text-[#3d6b9e] mb-1.5">{field.label}</label>
                  <div className="relative">
                    <select
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="appearance-none w-full px-3 py-2 border border-[#c4d9f2] rounded-md text-sm bg-white text-[#1a1f36] focus:ring-2 focus:ring-[#1a6fb5]"
                    >
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8c939d] pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#c4d9f2]">
              <div>
                <label className="block text-xs font-medium text-[#3d6b9e] mb-1.5">Question Period</label>
                <input
                  type="date"
                  value={questionPeriod}
                  onChange={(e) => setQuestionPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-[#c4d9f2] rounded-md text-sm bg-white text-[#1a1f36] focus:ring-2 focus:ring-[#1a6fb5]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#3d6b9e] mb-1.5">Acceptance Period (Days)</label>
                <input
                  type="number"
                  value={acceptancePeriod}
                  onChange={(e) => setAcceptancePeriod(e.target.value)}
                  placeholder="e.g., 30"
                  className="w-full px-3 py-2 border border-[#c4d9f2] rounded-md text-sm bg-white text-[#1a1f36] focus:ring-2 focus:ring-[#1a6fb5]"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#3d6b9e] mb-1.5">Estimated Award Date</label>
                <input
                  type="date"
                  value={estimatedAwardDate}
                  onChange={(e) => setEstimatedAwardDate(e.target.value)}
                  className="w-full px-3 py-2 border border-[#c4d9f2] rounded-md text-sm bg-white text-[#1a1f36] focus:ring-2 focus:ring-[#1a6fb5]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {showLossData && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-xs font-semibold text-red-800 uppercase tracking-wide">Loss Data Tracking</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-red-700 mb-1.5">Winning Competitor</label>
              <input
                type="text"
                placeholder="Company that won the business"
                className="w-full px-3 py-2 border border-red-200 rounded-md text-sm bg-white text-[#1a1f36] focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-red-700 mb-1.5">Loss Reason</label>
              <div className="relative">
                <select className="appearance-none w-full px-3 py-2 border border-red-200 rounded-md text-sm bg-white text-[#1a1f36] focus:ring-2 focus:ring-red-500">
                  <option value="">Select reason...</option>
                  <option value="price">Price too high</option>
                  <option value="delivery">Delivery time</option>
                  <option value="specifications">Product specifications</option>
                  <option value="relationship">Existing relationship</option>
                  <option value="other">Other</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8c939d] pointer-events-none" />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-red-700 mb-1.5">Additional Notes</label>
              <textarea
                placeholder="Additional details about why we lost this opportunity..."
                className="w-full px-3 py-2 border border-red-200 rounded-md text-sm bg-white text-[#1a1f36] focus:ring-2 focus:ring-red-500"
                rows={3}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

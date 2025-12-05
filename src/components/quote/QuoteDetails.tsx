import React from 'react';
import { FileText, ChevronDown, Calendar, AlertTriangle } from 'lucide-react';

interface QuoteDetailsProps {
  quoteStatus?: string;
  onStatusChange?: (status: string) => void;
  onSupplyPeriodChange?: (months: number) => void;
}

export const QuoteDetails: React.FC<QuoteDetailsProps> = ({ quoteStatus = 'draft', onStatusChange, onSupplyPeriodChange }) => {
  const [showLossData, setShowLossData] = React.useState(quoteStatus === 'lost');
  const [quoteType, setQuoteType] = React.useState('Daily Quote');
  const [supplyPeriod, setSupplyPeriod] = React.useState('');
  const [dbeRequired, setDbeRequired] = React.useState('N');
  const [bidBondRequired, setBidBondRequired] = React.useState('N');
  const [performanceBondRequired, setPerformanceBondRequired] = React.useState('N');
  const [insuranceRequired, setInsuranceRequired] = React.useState('N');
  
  // Additional bid requirement fields
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
  
  // Date and numeric fields
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
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 text-gray-700 mb-4">
        <FileText className="h-3 w-3" />
        <span className="text-xs font-medium">Request for Quote Details</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Quote Type <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select 
              value={quoteType}
              onChange={(e) => setQuoteType(e.target.value)}
              className="appearance-none w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs"
            >
              <option>Daily Quote</option>
              <option>Bid</option>
            </select>
            <ChevronDown className="absolute right-1 top-1.5 h-2 w-2 text-gray-400" />
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Customer Bid Number
          </label>
          <input
            type="text"
            placeholder="Customer's bid reference number"
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Purchase Order Number
          </label>
          <input
            type="text"
            placeholder="Optional PO reference"
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Valid Until <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              defaultValue="2025-09-13"
              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <Calendar className="absolute right-1 top-1.5 h-2 w-2 text-gray-400" />
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Supply Period (months)
          </label>
          <input
            type="number"
            placeholder="e.g., 36 for 3 years"
            value={supplyPeriod}
            onChange={(e) => handleSupplyPeriodChange(e.target.value)}
            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            min="1"
            max="60"
          />
          {parseInt(supplyPeriod) > 12 && (
            <div className="text-xs text-blue-600 mt-1">
              Multi-year contract: {Math.ceil(parseInt(supplyPeriod) / 12)} years
            </div>
          )}
        </div>
        
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Ship Until
          </label>
          <div className="relative">
            <input
              type="date"
              defaultValue="2025-11-13"
              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <Calendar className="absolute right-1 top-1.5 h-2 w-2 text-gray-400" />
          </div>
        </div>
      </div>
      
      {quoteType === 'Bid' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="h-3 w-3 text-blue-600" />
            <span className="text-xs font-medium text-blue-900">Bid Requirements</span>
          </div>
          
          <div className="space-y-4">
            {/* Original Requirements Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  DBE Requirement?
                </label>
                <div className="relative">
                  <select
                    value={dbeRequired}
                    onChange={(e) => setDbeRequired(e.target.value)}
                    className="appearance-none w-full px-2 py-1 border border-blue-300 dark:border-blue-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                  <ChevronDown className="absolute right-1 top-1.5 h-2 w-2 text-blue-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  Bid Bond Required?
                </label>
                <div className="relative">
                  <select
                    value={bidBondRequired}
                    onChange={(e) => setBidBondRequired(e.target.value)}
                    className="appearance-none w-full px-2 py-1 border border-blue-300 dark:border-blue-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                  <ChevronDown className="absolute right-1 top-1.5 h-2 w-2 text-blue-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  Performance Bond Required?
                </label>
                <div className="relative">
                  <select
                    value={performanceBondRequired}
                    onChange={(e) => setPerformanceBondRequired(e.target.value)}
                    className="appearance-none w-full px-2 py-1 border border-blue-300 dark:border-blue-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                  <ChevronDown className="absolute right-1 top-1.5 h-2 w-2 text-blue-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  Insurance Required?
                </label>
                <div className="relative">
                  <select
                    value={insuranceRequired}
                    onChange={(e) => setInsuranceRequired(e.target.value)}
                    className="appearance-none w-full px-2 py-1 border border-blue-300 dark:border-blue-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                  <ChevronDown className="absolute right-1 top-1.5 h-2 w-2 text-blue-400" />
                </div>
              </div>
            </div>

            {/* Additional Requirements - Row 1 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  Customer Delivery Requirement?
                </label>
                <div className="relative">
                  <select
                    value={customerDeliveryReq}
                    onChange={(e) => setCustomerDeliveryReq(e.target.value)}
                    className="appearance-none w-full px-2 py-1 border border-blue-300 dark:border-blue-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                  <ChevronDown className="absolute right-1 top-1.5 h-2 w-2 text-blue-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  Stock Requirement?
                </label>
                <div className="relative">
                  <select
                    value={stockRequirement}
                    onChange={(e) => setStockRequirement(e.target.value)}
                    className="appearance-none w-full px-2 py-1 border border-blue-300 dark:border-blue-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                  <ChevronDown className="absolute right-1 top-1.5 h-2 w-2 text-blue-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  Inventory Impact?
                </label>
                <div className="relative">
                  <select
                    value={inventoryImpact}
                    onChange={(e) => setInventoryImpact(e.target.value)}
                    className="appearance-none w-full px-2 py-1 border border-blue-300 dark:border-blue-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                  <ChevronDown className="absolute right-1 top-1.5 h-2 w-2 text-blue-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  Packaging & Labelling?
                </label>
                <div className="relative">
                  <select
                    value={packagingLabelling}
                    onChange={(e) => setPackagingLabelling(e.target.value)}
                    className="appearance-none w-full px-2 py-1 border border-blue-300 dark:border-blue-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                  <ChevronDown className="absolute right-1 top-1.5 h-2 w-2 text-blue-400" />
                </div>
              </div>
            </div>

            {/* Additional Requirements - Row 2 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  Special Requirements?
                </label>
                <div className="relative">
                  <select
                    value={specialRequirements}
                    onChange={(e) => setSpecialRequirements(e.target.value)}
                    className="appearance-none w-full px-2 py-1 border border-blue-300 dark:border-blue-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                  <ChevronDown className="absolute right-1 top-1.5 h-2 w-2 text-blue-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  Liquidated Damages?
                </label>
                <div className="relative">
                  <select
                    value={liquidatedDamages}
                    onChange={(e) => setLiquidatedDamages(e.target.value)}
                    className="appearance-none w-full px-2 py-1 border border-blue-300 dark:border-blue-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                  <ChevronDown className="absolute right-1 top-1.5 h-2 w-2 text-blue-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  Meet Buy America if Over $150,000?
                </label>
                <div className="relative">
                  <select
                    value={buyAmericaReq}
                    onChange={(e) => setBuyAmericaReq(e.target.value)}
                    className="appearance-none w-full px-2 py-1 border border-blue-300 dark:border-blue-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                  <ChevronDown className="absolute right-1 top-1.5 h-2 w-2 text-blue-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  EEO/APP?
                </label>
                <div className="relative">
                  <select
                    value={eeoApp}
                    onChange={(e) => setEeoApp(e.target.value)}
                    className="appearance-none w-full px-2 py-1 border border-blue-300 dark:border-blue-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                  <ChevronDown className="absolute right-1 top-1.5 h-2 w-2 text-blue-400" />
                </div>
              </div>
            </div>

            {/* Additional Requirements - Row 3 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  All or Nothing Bid?
                </label>
                <div className="relative">
                  <select
                    value={allOrNothingBid}
                    onChange={(e) => setAllOrNothingBid(e.target.value)}
                    className="appearance-none w-full px-2 py-1 border border-blue-300 dark:border-blue-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                  <ChevronDown className="absolute right-1 top-1.5 h-2 w-2 text-blue-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  One Time Buy?
                </label>
                <div className="relative">
                  <select
                    value={oneTimeBuy}
                    onChange={(e) => setOneTimeBuy(e.target.value)}
                    className="appearance-none w-full px-2 py-1 border border-blue-300 dark:border-blue-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                  <ChevronDown className="absolute right-1 top-1.5 h-2 w-2 text-blue-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  Contract Details?
                </label>
                <div className="relative">
                  <select
                    value={contractDetails}
                    onChange={(e) => setContractDetails(e.target.value)}
                    className="appearance-none w-full px-2 py-1 border border-blue-300 dark:border-blue-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                  <ChevronDown className="absolute right-1 top-1.5 h-2 w-2 text-blue-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  Amendments?
                </label>
                <div className="relative">
                  <select
                    value={amendments}
                    onChange={(e) => setAmendments(e.target.value)}
                    className="appearance-none w-full px-2 py-1 border border-blue-300 dark:border-blue-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                  <ChevronDown className="absolute right-1 top-1.5 h-2 w-2 text-blue-400" />
                </div>
              </div>
            </div>

            {/* Additional Requirements - Row 4 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  Alternates Allowed?
                </label>
                <div className="relative">
                  <select
                    value={alternatesAllowed}
                    onChange={(e) => setAlternatesAllowed(e.target.value)}
                    className="appearance-none w-full px-2 py-1 border border-blue-300 dark:border-blue-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                  <ChevronDown className="absolute right-1 top-1.5 h-2 w-2 text-blue-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  OEM Brand Specific?
                </label>
                <div className="relative">
                  <select
                    value={oemBrandSpecific}
                    onChange={(e) => setOemBrandSpecific(e.target.value)}
                    className="appearance-none w-full px-2 py-1 border border-blue-300 dark:border-blue-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                  <ChevronDown className="absolute right-1 top-1.5 h-2 w-2 text-blue-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  Kinetik?
                </label>
                <div className="relative">
                  <select
                    value={kinetik}
                    onChange={(e) => setKinetik(e.target.value)}
                    className="appearance-none w-full px-2 py-1 border border-blue-300 dark:border-blue-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                  <ChevronDown className="absolute right-1 top-1.5 h-2 w-2 text-blue-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  Price Negotiable?
                </label>
                <div className="relative">
                  <select
                    value={priceNegotiable}
                    onChange={(e) => setPriceNegotiable(e.target.value)}
                    className="appearance-none w-full px-2 py-1 border border-blue-300 dark:border-blue-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="N">No</option>
                    <option value="Y">Yes</option>
                  </select>
                  <ChevronDown className="absolute right-1 top-1.5 h-2 w-2 text-blue-400" />
                </div>
              </div>
            </div>

            {/* Date and Numeric Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-blue-200">
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  Question Period
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={questionPeriod}
                    onChange={(e) => setQuestionPeriod(e.target.value)}
                    className="w-full px-2 py-1 border border-blue-300 dark:border-blue-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <Calendar className="absolute right-1 top-1.5 h-2 w-2 text-blue-400" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  Acceptance Period (Days)
                </label>
                <input
                  type="number"
                  value={acceptancePeriod}
                  onChange={(e) => setAcceptancePeriod(e.target.value)}
                  placeholder="e.g., 30"
                  className="w-full px-2 py-1 border border-blue-300 dark:border-blue-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  min="1"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  Estimated Award Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={estimatedAwardDate}
                    onChange={(e) => setEstimatedAwardDate(e.target.value)}
                    className="w-full px-2 py-1 border border-blue-300 dark:border-blue-600 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <Calendar className="absolute right-1 top-1.5 h-2 w-2 text-blue-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showLossData && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="h-3 w-3 text-red-600" />
            <span className="text-xs font-medium text-red-900">Loss Data Tracking</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-red-700 mb-1">
                Winning Competitor
              </label>
              <input
                type="text"
                placeholder="Company that won the business"
                className="w-full px-2 py-1 border border-red-300 dark:border-red-600 rounded-lg text-xs focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-red-700 mb-1">
                Loss Reason
              </label>
              <select className="appearance-none w-full px-2 py-1 border border-red-300 dark:border-red-600 rounded-lg text-xs focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                <option value="">Select reason...</option>
                <option value="price">Price too high</option>
                <option value="delivery">Delivery time</option>
                <option value="specifications">Product specifications</option>
                <option value="relationship">Existing relationship</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-red-700 mb-1">
                Additional Notes
              </label>
              <textarea
                placeholder="Additional details about why we lost this opportunity..."
                className="w-full px-2 py-1 border border-red-300 dark:border-red-600 rounded-lg text-xs focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                rows={3}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
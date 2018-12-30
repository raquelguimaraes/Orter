class DownvotesController < ApplicationController

  def create
    downvote = Downvote.new(downvote_params)

    respond_to do |format|
      if downvote.save
        point = downvote.point
        Rails.cache.delete("retro_#{point.section.retro.name}_#{point.section.retro.id}")
        format.json  { render :json => downvote.to_json, :status => :created }
      else
        format.json  { render :json => downvote.errors.to_json, :status => :unprocessable_entity }
      end
    end
  end

  private

  def downvote_params
    params.require(:downvote).permit(:point_id)
  end

end

